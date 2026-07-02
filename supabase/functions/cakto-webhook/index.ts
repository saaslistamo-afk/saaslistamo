import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const payload = await req.json();

    const email     = payload.customer?.email ?? payload.email;
    const compraId  = payload.id ?? payload.order_id ?? payload.sale_id ?? null;

    if (!email) {
      return new Response(JSON.stringify({ error: "email ausente no payload" }), { status: 400 });
    }

    // Salva (ou atualiza) a assinatura pelo email
    const { error } = await supabase
      .from("assinaturas")
      .upsert({ email, plano: "premium", compra_id: compraId }, { onConflict: "email" });

    if (error) throw error;

    // Se o usuário já existe no Supabase, promove agora mesmo
    const { data: users } = await supabase.auth.admin.listUsers();
    const existente = users?.users.find((u) => u.email === email);
    if (existente) {
      await supabase.auth.admin.updateUserById(existente.id, {
        user_metadata: { ...existente.user_metadata, plano: "premium" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
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
