import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const CAKTO_WEBHOOK_SECRET = Deno.env.get("CAKTO_WEBHOOK_SECRET");

// Comparação em tempo constante para evitar timing attack no segredo.
function segredoValido(recebido: unknown): boolean {
  if (!CAKTO_WEBHOOK_SECRET || typeof recebido !== "string") return false;
  const a = new TextEncoder().encode(recebido);
  const b = new TextEncoder().encode(CAKTO_WEBHOOK_SECRET);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function atualizarPlanoUsuario(email: string, plano: string, validoAte?: string | null) {
  // `assinaturas` é a única fonte de verdade sobre o plano do usuário — o
  // frontend lê só daqui (RLS: usuário só lê a própria linha). Não gravamos
  // mais em user_metadata: é editável pelo próprio usuário no client, então
  // usá-lo para liberar acesso premium seria burlável.
  const dados: Record<string, unknown> = { email, plano };
  if (validoAte !== undefined) dados.valido_ate = validoAte;
  await supabase
    .from("assinaturas")
    .upsert(dados, { onConflict: "email" });
}

// A Cakto não documenta em qual caminho exato do payload vem a próxima
// cobrança da assinatura — tentamos os caminhos mais prováveis pela
// referência de campos deles (subscription.next_payment_date). Se nenhum
// bater, fica null (tratado como "não sabemos", nunca como data passada).
function extrairProximaCobranca(payload: Record<string, unknown>): string | null {
  const data = payload.data as Record<string, unknown> | undefined;
  const subscription = (data?.subscription ?? (payload as Record<string, unknown>).subscription) as Record<string, unknown> | undefined;
  const bruta = subscription?.next_payment_date ?? data?.next_payment_date ?? null;
  if (!bruta || typeof bruta !== "string") return null;
  const d = new Date(bruta);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    let payload;
    try {
      payload = await req.json();
    } catch {
      // Corpo ausente ou JSON inválido é erro do chamador, não nosso — 400
      // em vez de 500, e sem ecoar a mensagem interna do parser na resposta.
      return new Response(JSON.stringify({ error: "corpo da requisição inválido" }), { status: 400 });
    }

    if (!segredoValido(payload.secret)) {
      console.error("[webhook] segredo ausente ou inválido");
      return new Response(JSON.stringify({ error: "assinatura inválida" }), { status: 401 });
    }

    const emailBruto = payload.data?.customer?.email ?? payload.customer?.email ?? payload.email;
    const evento      = payload.event ?? payload.type ?? "";
    const compraId    = payload.data?.id ?? payload.id ?? null;

    if (!emailBruto) {
      return new Response(JSON.stringify({ error: "email ausente no payload" }), { status: 400 });
    }
    // Normalizado (trim + minúsculas) pra sempre bater com o e-mail da conta
    // no Supabase Auth, independente de como a Cakto capitalizou o payload.
    const email = String(emailBruto).trim().toLowerCase();

    // Idempotência: se a Cakto reenviar exatamente este evento de novo
    // (timeout do lado deles, retry automático, instabilidade de rede), não
    // processa duas vezes. A tabela tem (compra_id, evento) como chave
    // primária — inserir a mesma dupla de novo dá conflito, e a gente
    // ignora o reenvio. Não protege contra eventos DIFERENTES chegando fora
    // de ordem (ex.: um cancelamento antigo processado depois de uma
    // reativação mais nova) — isso exigiria comparar um timestamp do
    // payload, que não é confiável pra todos os tipos de evento
    // documentados pela Cakto.
    if (compraId) {
      const { error: erroDedupe } = await supabase
        .from("webhook_eventos_processados")
        .insert({ compra_id: String(compraId), evento });
      if (erroDedupe) {
        if (erroDedupe.code === "23505") {
          console.log(`[webhook] evento duplicado ignorado: ${evento} / ${compraId}`);
          return new Response(JSON.stringify({ ok: true, duplicado: true }), {
            headers: { "Content-Type": "application/json" },
          });
        }
        // Falha ao registrar o dedupe não deve travar um pagamento real —
        // só loga e segue processando normalmente.
        console.error("[webhook] falha ao registrar dedupe (seguindo mesmo assim):", erroDedupe);
      }
    }

    // Nomes exatos confirmados na documentação oficial da Cakto
    // (https://cakto-dece4a15.mintlify.app/webhooks/eventos) — antes eram
    // deduzidos, e "subscription_cancelled" (duas letras "L") nunca batia
    // com o evento real "subscription_canceled" (uma letra "L"): assinaturas
    // canceladas nunca tinham o acesso revogado.
    const eventosAprovacao = ["purchase_approved", "subscription_renewed"];
    // Estorno de dinheiro de verdade — revoga na hora, sem carência nenhuma.
    const eventosRevogacaoImediata = ["refund", "chargeback"];

    if (eventosAprovacao.some((e) => evento.toLowerCase().includes(e))) {
      // Compra/renovação aprovada → promove para premium e guarda até quando
      // esse período já pago vale (log do payload bruto pra calibrar o
      // caminho do campo assim que o primeiro evento real chegar).
      const validoAte = extrairProximaCobranca(payload);
      console.log(`[webhook] payload bruto (${evento}):`, JSON.stringify(payload));
      await atualizarPlanoUsuario(email, "premium", validoAte);
      console.log(`[webhook] premium ativado: ${email} (compra: ${compraId}, válido até: ${validoAte ?? "desconhecido"})`);
    } else if (eventosRevogacaoImediata.some((e) => evento.toLowerCase().includes(e))) {
      // Reembolso/chargeback → revoga acesso na hora, mesmo dentro do período pago.
      await atualizarPlanoUsuario(email, "revogado", null);
      console.log(`[webhook] acesso revogado imediatamente: ${email} (evento: ${evento})`);
    } else if (evento.toLowerCase().includes("subscription_canceled")) {
      // Cancelamento não documentado quanto ao timing (a Cakto não diz se
      // dispara no clique ou só no fim do período pago) — por isso NÃO
      // revoga na hora. Se já sabemos até quando o período pago vale
      // (valido_ate gravado numa aprovação/renovação anterior), o acesso
      // expira sozinho nessa data (checado no frontend, ver AuthContext.jsx).
      // Só cai no revogo-na-hora se nunca tivemos essa data (rede de
      // segurança pro caso de nunca termos conseguido extrair o campo).
      const { data: atual } = await supabase.from("assinaturas").select("valido_ate").eq("email", email).maybeSingle();
      console.log(`[webhook] payload bruto (${evento}):`, JSON.stringify(payload));
      if (atual?.valido_ate) {
        console.log(`[webhook] cancelamento registrado, acesso mantido até ${atual.valido_ate}: ${email}`);
      } else {
        await atualizarPlanoUsuario(email, "revogado", null);
        console.log(`[webhook] cancelamento sem valido_ate conhecido — revogado na hora (fallback): ${email}`);
      }
    } else {
      console.log(`[webhook] evento ignorado: ${evento} para ${email}`);
    }

    return new Response(JSON.stringify({ ok: true, evento, email }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Erro no webhook:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
