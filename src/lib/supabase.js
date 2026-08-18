import { createClient } from "@supabase/supabase-js";

// Com a aba oculta (fechando ou em segundo plano), mantém a requisição viva
// além do descarregamento da página — sem isso, o salvamento forçado ao sair
// do app (ver AppContext.jsx) pode ser abortado pelo navegador a meio caminho.
// `keepalive` tem limite de ~64KB por requisição; se estourar isso, cai de
// volta pra uma requisição normal em vez de falhar direto.
function fetchComKeepaliveQuandoOculto(input, init) {
  if (document.visibilityState !== "hidden") return fetch(input, init);
  return fetch(input, { ...init, keepalive: true }).catch(() => fetch(input, init));
}

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { global: { fetch: fetchComKeepaliveQuandoOculto } }
);
