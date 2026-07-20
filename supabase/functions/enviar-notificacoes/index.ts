import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const VAPID_PUBLIC_KEY  = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT     = "mailto:suporte@listamo.com.br";

const CRON_SECRET = Deno.env.get("CRON_SECRET");

// Comparação em tempo constante para evitar timing attack no segredo.
function segredoValido(recebido: string | null): boolean {
  if (!CRON_SECRET || !recebido) return false;
  const a = new TextEncoder().encode(recebido);
  const b = new TextEncoder().encode(CRON_SECRET);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

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

// Mesma regra de src/mock/data.js (statusValidade): vencido = já passou,
// vencendo = até 3 dias. Duplicada aqui porque a function roda em Deno,
// sem acesso ao código do frontend.
function statusValidade(dataValidade: string, hoje: Date): "vencido" | "vencendo" | "valido" {
  const dias = Math.ceil((new Date(dataValidade).getTime() - hoje.getTime()) / 86_400_000);
  if (dias < 0) return "vencido";
  if (dias <= 3) return "vencendo";
  return "valido";
}

type Notificacao = { title: string; body: string; url: string; tag: string };

// Mesma regra de AppShell.jsx (useEffect "verifica condições locais"): despensa
// vencendo e orçamento estourando. Antes só disparavam como notificação local
// (só quando o usuário abria o app); agora viram push de verdade, então
// chegam mesmo com o app fechado.
function notificacoesDoUsuario(dadosUsuario: Record<string, unknown> | null, hoje: Date): Notificacao[] {
  if (!dadosUsuario) return [];
  const prefs = (dadosUsuario.notificacoes as Record<string, boolean>) ?? {};
  const notificacoes: Notificacao[] = [];

  if (prefs.validade) {
    const despensa = (dadosUsuario.despensa as Array<{ dataValidade?: string }>) ?? [];
    const criticos = despensa.filter((d) => {
      if (!d.dataValidade) return false;
      const s = statusValidade(d.dataValidade, hoje);
      return s === "vencendo" || s === "vencido";
    });
    if (criticos.length > 0) {
      notificacoes.push({
        title: "Atenção na despensa!",
        body: `${criticos.length} ${criticos.length === 1 ? "item está" : "itens estão"} vencendo ou vencidos. Confira agora.`,
        url: "/despensa",
        tag: "despensa",
      });
    }
  }

  if (prefs.orcamento) {
    const orcamento = Number(dadosUsuario.orcamento) || 0;
    const mesAtual = hoje.toISOString().slice(0, 7);
    const historico = (dadosUsuario.historico_precos as Array<{ data?: string; preco?: number; quantidade?: number }>) ?? [];
    const gastoMes = historico
      .filter((r) => r.data?.startsWith(mesAtual))
      .reduce((s, r) => s + (r.preco ?? 0) * (r.quantidade ?? 1), 0);

    if (orcamento > 0 && gastoMes >= orcamento * 0.8) {
      notificacoes.push({
        title: "Orçamento quase no limite",
        body: `Você já usou ${Math.round((gastoMes / orcamento) * 100)}% do orçamento do mês.`,
        url: "/dashboard",
        tag: "orcamento",
      });
    }
  }

  if (prefs.resumoDiario) {
    const hora = hoje.getHours();
    const corpo = hora >= 17
      ? "Que itens faltam na sua lista para amanhã? Confira agora. 📋"
      : "Bom dia! Abra o app para ver sua lista e despensa de hoje. 🛒";
    notificacoes.push({ title: "Listamo", body: corpo, url: "/dashboard", tag: "diario" });
  }

  return notificacoes;
}

Deno.serve(async (req) => {
  if (!segredoValido(req.headers.get("x-cron-secret"))) {
    return new Response(JSON.stringify({ error: "segredo inválido" }), { status: 401 });
  }

  const { data: subs } = await supabase.from("push_subscriptions").select("*");
  if (!subs?.length) {
    return new Response(JSON.stringify({ ok: true, enviados: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const userIds = subs.map((s) => s.user_id);
  const { data: dados } = await supabase
    .from("dados_usuario")
    .select("user_id, despensa, orcamento, historico_precos, notificacoes")
    .in("user_id", userIds);
  const dadosPorUsuario = new Map((dados ?? []).map((d) => [d.user_id, d]));

  const hoje = new Date();
  let enviados = 0;

  for (const row of subs) {
    const notificacoes = notificacoesDoUsuario(dadosPorUsuario.get(row.user_id) ?? null, hoje);
    if (!notificacoes.length) continue;

    try {
      const sub = JSON.parse(row.subscription);
      let subscriptionExpirada = false;

      for (const notif of notificacoes) {
        const status = await enviarPush(sub, notif);
        if (status === 410 || status === 404) {
          subscriptionExpirada = true;
          break;
        } else if (status < 300) {
          enviados++;
        }
      }

      if (subscriptionExpirada) {
        await supabase.from("push_subscriptions").delete().eq("user_id", row.user_id);
      }
    } catch {}
  }

  return new Response(JSON.stringify({ ok: true, enviados }), {
    headers: { "Content-Type": "application/json" },
  });
});
