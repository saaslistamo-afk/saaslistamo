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

async function atualizarPlanoUsuario(email: string, plano: string) {
  // `assinaturas` é a única fonte de verdade sobre o plano do usuário — o
  // frontend lê só daqui (RLS: usuário só lê a própria linha). Não gravamos
  // mais em user_metadata: é editável pelo próprio usuário no client, então
  // usá-lo para liberar acesso premium seria burlável.
  await supabase
    .from("assinaturas")
    .upsert({ email, plano }, { onConflict: "email" });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const payload = await req.json();

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
    const eventosRevogacao = ["refund", "chargeback", "subscription_canceled"];

    if (eventosAprovacao.some((e) => evento.toLowerCase().includes(e))) {
      // Compra aprovada → promove para premium
      await atualizarPlanoUsuario(email, "premium");
      console.log(`[webhook] premium ativado: ${email} (compra: ${compraId})`);
    } else if (eventosRevogacao.some((e) => evento.toLowerCase().includes(e))) {
      // Reembolso/chargeback → revoga acesso
      await atualizarPlanoUsuario(email, "revogado");
      console.log(`[webhook] acesso revogado: ${email} (evento: ${evento})`);
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
