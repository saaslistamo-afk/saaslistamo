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

    // Cakto envia os dados do cliente no payload
    // Adapte os campos conforme o webhook real do Cakto
    const email = payload.customer?.email || payload.email;
    const nome  = payload.customer?.name  || payload.name || "";

    if (!email) {
      return new Response("Email não encontrado no payload", { status: 400 });
    }

    // Tenta criar o usuário no Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { nome, plano: "premium" },
      // gera uma senha temporária — o usuário vai redefinir via email
      password: crypto.randomUUID(),
    });

    if (error && error.message.includes("already been registered")) {
      // usuário já existe — atualiza para premium
      const { data: users } = await supabase.auth.admin.listUsers();
      const existente = users.users.find((u) => u.email === email);
      if (existente) {
        await supabase.auth.admin.updateUserById(existente.id, {
          user_metadata: { ...existente.user_metadata, plano: "premium" },
        });
      }
    } else if (error) {
      throw error;
    }

    // Envia email de redefinição de senha para o cliente criar sua própria senha
    await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Erro no webhook:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
