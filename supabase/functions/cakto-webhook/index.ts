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

    const email    = payload.data?.customer?.email ?? payload.customer?.email ?? payload.email;
    const evento   = payload.event ?? payload.type ?? "";
    const compraId = payload.data?.id ?? payload.id ?? null;

    if (!email) {
      return new Response(JSON.stringify({ error: "email ausente no payload" }), { status: 400 });
    }

    const eventosAprovacao = ["compra_aprovada", "purchase_approved", "sale_approved", "order_paid"];
    const eventosRevogacao = ["reembolso", "refund", "chargeback", "estorno", "cancelamento", "subscription_cancelled"];

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
