import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const VAPID_PUBLIC_KEY  = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT     = "mailto:suporte@listamo.com.br";

// converte base64url → Uint8Array
function base64urlToUint8Array(str: string): Uint8Array {
  const padding = "=".repeat((4 - (str.length % 4)) % 4);
  const base64 = (str + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

function uint8ArrayToBase64url(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function gerarJWT(sub: string): Promise<string> {
  const header  = { alg: "ES256", typ: "JWT" };
  const payload = { aud: new URL(sub).origin, exp: Math.floor(Date.now() / 1000) + 3600, sub: VAPID_SUBJECT };

  const encode = (obj: object) =>
    uint8ArrayToBase64url(new TextEncoder().encode(JSON.stringify(obj)));

  const unsigned = `${encode(header)}.${encode(payload)}`;

  const privKeyBytes = base64urlToUint8Array(VAPID_PRIVATE_KEY);
  const cryptoKey = await crypto.subtle.importKey(
    "raw", privKeyBytes,
    { name: "ECDSA", namedCurve: "P-256" },
    false, ["sign"]
  );
  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    new TextEncoder().encode(unsigned)
  );
  return `${unsigned}.${uint8ArrayToBase64url(new Uint8Array(sig))}`;
}

async function enviarPush(subscription: { endpoint: string; keys: { p256dh: string; auth: string } }, payload: object): Promise<number> {
  const jwt = await gerarJWT(subscription.endpoint);

  const res = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      "Authorization": `vapid t=${jwt},k=${VAPID_PUBLIC_KEY}`,
      "Content-Type": "application/json",
      "TTL": "86400",
    },
    body: JSON.stringify(payload),
  });
  return res.status;
}

Deno.serve(async () => {
  const { data: rows } = await supabase.from("push_subscriptions").select("*");
  if (!rows?.length) {
    return new Response(JSON.stringify({ ok: true, enviados: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const hora = new Date().getHours();
  let titulo = "Listamo";
  let corpo  = "Bom dia! Abra o app para ver sua lista e despensa de hoje. 🛒";

  if (hora >= 17) {
    corpo = "Que itens faltam na sua lista para amanhã? Confira agora. 📋";
  }

  let enviados = 0;
  for (const row of rows) {
    try {
      const sub = JSON.parse(row.subscription);
      const status = await enviarPush(sub, { title: titulo, body: corpo, url: "/dashboard", tag: "diario" });

      if (status === 410 || status === 404) {
        // subscription expirada — remove
        await supabase.from("push_subscriptions").delete().eq("user_id", row.user_id);
      } else if (status < 300) {
        enviados++;
      }
    } catch {}
  }

  return new Response(JSON.stringify({ ok: true, enviados }), {
    headers: { "Content-Type": "application/json" },
  });
});
