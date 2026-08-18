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

function concatBytes(...partes: Uint8Array[]): Uint8Array {
  const total = partes.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of partes) { out.set(p, offset); offset += p.length; }
  return out;
}

async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, tamanho: number): Promise<Uint8Array> {
  const chave = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info },
    chave,
    tamanho * 8
  );
  return new Uint8Array(bits);
}

// Criptografia do payload conforme RFC 8291 (Message Encryption for Web
// Push) — sem isso, qualquer serviço de push real (Apple, Google, Mozilla)
// rejeita a requisição com 400 "BadWebPushRequest" assim que o corpo não
// está vazio, mesmo com a assinatura VAPID correta.
async function criptografarPayload(
  payloadBytes: Uint8Array,
  p256dhB64: string,
  authB64: string
): Promise<Uint8Array> {
  const uaPublicBytes = base64urlToUint8Array(p256dhB64); // ponto EC não-comprimido do assinante (65 bytes)
  const authSecret = base64urlToUint8Array(authB64);

  const uaPublicKey = await crypto.subtle.importKey(
    "raw", uaPublicBytes, { name: "ECDH", namedCurve: "P-256" }, true, []
  );

  const asKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]
  ) as CryptoKeyPair;
  const asPublicBytes = new Uint8Array(await crypto.subtle.exportKey("raw", asKeyPair.publicKey));

  const segredoCompartilhado = new Uint8Array(
    await crypto.subtle.deriveBits({ name: "ECDH", public: uaPublicKey }, asKeyPair.privateKey, 256)
  );

  const textoWebPushInfo = new TextEncoder().encode("WebPush: info\0");
  const keyInfo = concatBytes(textoWebPushInfo, uaPublicBytes, asPublicBytes);
  const ikm = await hkdf(authSecret, segredoCompartilhado, keyInfo, 32);

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, new TextEncoder().encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, new TextEncoder().encode("Content-Encoding: nonce\0"), 12);

  const cekKey = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  // delimitador 0x02 = último (e único) registro, conforme RFC 8188
  const textoClaro = concatBytes(payloadBytes, new Uint8Array([2]));
  const cifrado = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, cekKey, textoClaro)
  );

  const recordSize = new Uint8Array(4);
  new DataView(recordSize.buffer).setUint32(0, 4096);
  const cabecalho = concatBytes(salt, recordSize, new Uint8Array([asPublicBytes.length]), asPublicBytes);

  return concatBytes(cabecalho, cifrado);
}

// Formato "raw" do WebCrypto só existe para chave PÚBLICA de curva elíptica
// (o ponto não-comprimido: 0x04 + x + y). Chave privada precisa ir como JWK
// — por isso construímos o JWK a partir do "d" (escalar privado, já temos)
// e do x/y (extraídos da própria chave pública, que também já temos).
async function importarChavePrivada(): Promise<CryptoKey> {
  const pubBytes = base64urlToUint8Array(VAPID_PUBLIC_KEY); // 0x04 + x(32) + y(32)
  const x = uint8ArrayToBase64url(pubBytes.slice(1, 33));
  const y = uint8ArrayToBase64url(pubBytes.slice(33, 65));

  return crypto.subtle.importKey(
    "jwk",
    { kty: "EC", crv: "P-256", d: VAPID_PRIVATE_KEY, x, y, ext: true },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );
}

async function gerarJWT(sub: string): Promise<string> {
  const header  = { alg: "ES256", typ: "JWT" };
  const payload = { aud: new URL(sub).origin, exp: Math.floor(Date.now() / 1000) + 3600, sub: VAPID_SUBJECT };

  const encode = (obj: object) =>
    uint8ArrayToBase64url(new TextEncoder().encode(JSON.stringify(obj)));

  const unsigned = `${encode(header)}.${encode(payload)}`;

  const cryptoKey = await importarChavePrivada();
  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    new TextEncoder().encode(unsigned)
  );
  return `${unsigned}.${uint8ArrayToBase64url(new Uint8Array(sig))}`;
}

async function enviarPush(subscription: { endpoint: string; keys: { p256dh: string; auth: string } }, payload: object): Promise<{ status: number; corpo: string }> {
  const jwt = await gerarJWT(subscription.endpoint);
  const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
  const corpoCifrado = await criptografarPayload(payloadBytes, subscription.keys.p256dh, subscription.keys.auth);

  const res = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      "Authorization": `vapid t=${jwt},k=${VAPID_PUBLIC_KEY}`,
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      "TTL": "86400",
    },
    body: corpoCifrado,
  });
  const corpo = await res.text().catch(() => "");
  return { status: res.status, corpo };
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

// O servidor roda em UTC; os horários que a pessoa escolhe no app são no
// fuso de Brasília (UTC-3, sem horário de verão desde 2019). Deslocar a data
// inteira (não só a hora) garante que dia da semana/mês também fiquem
// corretos perto da virada da meia-noite BRT.
function dataBRT(hoje: Date): Date {
  return new Date(hoje.getTime() - 3 * 3_600_000);
}

// "HH:MM" escolhido no perfil → hora (0-23). Sem preferência salva ainda,
// mantém o horário padrão de sempre (8h) pra não silenciar quem já tinha
// notificação ativada antes dessa funcionalidade existir.
function horaPreferida(horario: unknown): number {
  if (typeof horario !== "string") return 8;
  const hora = parseInt(horario.slice(0, 2), 10);
  return Number.isFinite(hora) ? hora : 8;
}

type AlertaValidade = { horario?: string; diaSemana?: number; diaMes?: number };

// Decide se o alerta de validade deve disparar agora, de acordo com a
// frequência escolhida pela usuária: "unica" (padrão/legado) usa o mesmo
// horário compartilhado com orçamento/resumo diário; "diaria"/"semanal"/
// "mensal" usam validadeAlertas (1 entrada por disparo configurado).
function validadeDeveDisparar(
  prefs: Record<string, unknown>,
  horaAtual: number,
  diaSemanaAtual: number,
  diaMesAtual: number,
): boolean {
  const frequencia = prefs.validadeFrequencia;
  const alertas = (prefs.validadeAlertas as AlertaValidade[] | undefined) ?? [];

  if (frequencia === "diaria") {
    return alertas.some((a) => horaPreferida(a.horario) === horaAtual);
  }
  if (frequencia === "semanal") {
    return alertas.some((a) => a.diaSemana === diaSemanaAtual && horaPreferida(a.horario) === horaAtual);
  }
  if (frequencia === "mensal") {
    return alertas.some((a) => a.diaMes === diaMesAtual && horaPreferida(a.horario) === horaAtual);
  }
  return horaPreferida(prefs.horario) === horaAtual;
}

type Notificacao = { title: string; body: string; url: string; tag: string };

// Mesma regra de AppShell.jsx (useEffect "verifica condições locais"): despensa
// vencendo e orçamento estourando. Antes só disparavam como notificação local
// (só quando o usuário abria o app); agora viram push de verdade, então
// chegam mesmo com o app fechado.
function notificacoesDoUsuario(
  dadosUsuario: Record<string, unknown> | null,
  hoje: Date,
  horaBRT: number,
  diaSemanaAtual: number,
  diaMesAtual: number,
): Notificacao[] {
  if (!dadosUsuario) return [];
  const prefs = (dadosUsuario.notificacoes as Record<string, unknown>) ?? {};
  const notificacoes: Notificacao[] = [];
  const horarioCompartilhadoBateu = horaPreferida(prefs.horario) === horaBRT;

  if (prefs.validade && validadeDeveDisparar(prefs, horaBRT, diaSemanaAtual, diaMesAtual)) {
    const despensa = (dadosUsuario.despensa as Array<{ dataValidade?: string }>) ?? [];
    let vencidos = 0;
    let vencendo = 0;
    for (const d of despensa) {
      if (!d.dataValidade) continue;
      const s = statusValidade(d.dataValidade, hoje);
      if (s === "vencido") vencidos++;
      else if (s === "vencendo") vencendo++;
    }
    if (vencidos > 0 || vencendo > 0) {
      const partes: string[] = [];
      if (vencendo > 0) partes.push(`${vencendo} ${vencendo === 1 ? "item está" : "itens estão"} vencendo`);
      if (vencidos > 0) partes.push(`${vencidos} ${vencidos === 1 ? "venceu" : "venceram"}`);
      notificacoes.push({
        title: "Atenção na despensa!",
        body: `${partes.join(" e ")}. Confira já.`,
        url: "/despensa",
        tag: "despensa",
      });
    }
  }

  if (prefs.orcamento && horarioCompartilhadoBateu) {
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

  if (prefs.resumoDiario && horarioCompartilhadoBateu) {
    const corpo = horaBRT >= 17
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
  const agoraBRT = dataBRT(hoje);
  const horaAtual = agoraBRT.getUTCHours();
  const diaSemanaAtual = agoraBRT.getUTCDay();
  const diaMesAtual = agoraBRT.getUTCDate();
  let enviados = 0;

  // Roda de hora em hora; cada tipo de notificação decide, internamente em
  // notificacoesDoUsuario, se o horário/dia configurado bate com agora — não
  // dá mais pra filtrar todo mundo de uma vez com um único horário compartilhado,
  // já que o alerta de validade pode ter seus próprios dias/horários.
  for (const row of subs) {
    const dadosUsuario = dadosPorUsuario.get(row.user_id) ?? null;
    const notificacoes = notificacoesDoUsuario(dadosUsuario, hoje, horaAtual, diaSemanaAtual, diaMesAtual);
    if (!notificacoes.length) continue;

    try {
      const sub = JSON.parse(row.subscription);
      let subscriptionExpirada = false;

      for (const notif of notificacoes) {
        const { status } = await enviarPush(sub, notif);
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
