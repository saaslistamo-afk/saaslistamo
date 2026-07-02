import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

async function encontrarUsuario(email: string) {
  const { data } = await supabase.auth.admin.listUsers();
  return data?.users.find((u) => u.email === email) ?? null;
}

async function atualizarPlanoUsuario(email: string, plano: string) {
  // Atualiza tabela assinaturas
  await supabase
    .from("assinaturas")
    .upsert({ email, plano }, { onConflict: "email" });

  // Se usuário já existe no Supabase, atualiza metadata também
  const existente = await encontrarUsuario(email);
  if (existente) {
    await supabase.auth.admin.updateUserById(existente.id, {
      user_metadata: { ...existente.user_metadata, plano },
    });
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const payload = await req.json();

    const email    = payload.data?.customer?.email ?? payload.customer?.email ?? payload.email;
    const evento   = payload.event ?? payload.type ?? "";
    const compraId = payload.data?.id ?? payload.id ?? null;

    if (!email) {
      return new Response(JSON.stringify({ error: "email ausente no payload" }), { status: 400 });
    }

    const eventosAprovacao = ["compra_aprovada", "purchase_approved", "sale_approved", "order_paid"];
    const eventosRevogacao = ["reembolso", "refund", "chargeback", "estorno", "cancelamento", "subscription_cancelled"];

    if (eventosAprovacao.some((e) => evento.toLowerCase().includes(e)) || evento === "") {
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
