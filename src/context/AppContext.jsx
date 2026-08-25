import { createContext, useContext, useState, useMemo, useEffect, useRef } from "react";
import { MERCADOS_CONHECIDOS } from "../mock/data";
import { useAuth } from "./AuthContext";
import { supabase } from "../lib/supabase";

const _hoje = new Date();
const MES_ATUAL_PREFIXO = _hoje.toISOString().slice(0, 7);
const MES_ATUAL_LABEL   = _hoje.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
  .replace(/^./, (c) => c.toUpperCase());

const AppContext = createContext(null);

function lerLocal(chave, padrao) {
  try {
    const v = localStorage.getItem(chave);
    return v === null ? padrao : JSON.parse(v);
  } catch { return padrao; }
}

function usarEstadoPersistido(chave, padrao) {
  const [valor, setValor] = useState(() => lerLocal(chave, padrao));
  useEffect(() => {
    // Erro mais comum aqui é QuotaExceededError (localStorage cheio, ex. uma
    // foto de perfil grande) — sem o log, o valor ficava só em memória e
    // sumia no próximo reload sem nenhuma pista do motivo.
    try { localStorage.setItem(chave, JSON.stringify(valor)); }
    catch (err) { console.error(`[listamo] falha ao persistir "${chave}":`, err); }
  }, [chave, valor]);
  return [valor, setValor];
}

export function AppProvider({ children }) {
  const { usuario, planoAssinatura } = useAuth();
  // Override só pro seletor "Visualizando como" (DEV). Em produção fica
  // sempre null e o plano efetivo vem 100% de planoAssinatura — derivado
  // direto no useMemo abaixo, sem passar por useState+useEffect: copiar
  // planoAssinatura pra um state à parte atrasa `isPremium` em um ciclo de
  // render (o efeito só roda depois do primeiro render com o valor novo),
  // o que fazia RotaPrivada redirecionar pra /planos por engano logo após
  // o carregandoPlano virar false, mesmo já sabendo que o plano é premium.
  const [overridePlanoDev, setOverridePlanoDev] = useState(null);
  const [sincronizado, setSincronizado] = useState(false);
  // true quando o carregamento ou o salvamento falharam de vez (após as
  // tentativas) — usado só pra avisar a pessoa na interface que as
  // alterações podem não estar chegando no servidor; não afeta a lógica.
  const [erroSincronizacao, setErroSincronizacao] = useState(false);
  const saveTimerRef = useRef(null);
  const retryTimerRef = useRef(null);
  const dadosPendentesRef = useRef(null);
  // "assinatura" (JSON) do último estado já confirmado no servidor — usada
  // pra não fazer upsert nenhum quando nada mudou desde então (ex.: abrir o
  // app só pra olhar, sem editar nada), já que sincronizado vira true em
  // toda sessão.
  const ultimoSalvoRef = useRef(null);

  const [trialBannerVisivel, setTrialBannerVisivel] = usarEstadoPersistido("listamo:trialBanner", true);
  const [orcamento, setOrcamento]                   = usarEstadoPersistido("listamo:orcamento", 0);
  const [listas, setListas]                         = usarEstadoPersistido("listamo:listas", []);
  const [mercados, setMercados]                     = usarEstadoPersistido("listamo:mercados", MERCADOS_CONHECIDOS);
  const [mercadoAtual, setMercadoAtual]             = usarEstadoPersistido("listamo:mercadoAtual", MERCADOS_CONHECIDOS[0]);
  const [historicoPrecos, setHistoricoPrecos]       = usarEstadoPersistido("listamo:historicoPrecos", []);
  const [boasVindasPremium, setBoasVindasPremium]   = usarEstadoPersistido("listamo:boasVindas", false);
  const [despensa, setDespensaLocal]                = usarEstadoPersistido("listamo:despensa", []);
  const [darkMode, setDarkMode]     = usarEstadoPersistido("listamo:darkMode", false);
  const [fotoPerfil, setFotoPerfil] = usarEstadoPersistido("listamo:fotoPerfil", null);
  const [nome, setNome]             = usarEstadoPersistido("listamo:nome", "");
  const [email, setEmail]           = usarEstadoPersistido("listamo:email", "");
  const [notificacoes, setNotificacoes] = usarEstadoPersistido("listamo:notificacoes", {
    validade: false, resumoDiario: false, orcamento: false, horario: "08:00",
    // "unica" = 1x/dia no horário compartilhado acima (comportamento padrão/legado).
    // "diaria"/"semanal"/"mensal" usam validadeAlertas em vez do horário compartilhado.
    validadeFrequencia: "unica", validadeAlertas: [],
    // Com quantos dias de antecedência da validade avisar — [3] reproduz o
    // comportamento padrão/legado (3 dias antes). Ver deveNotificarAntecedencia.
    antecedenciaDias: [3],
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // Carrega dados do Supabase quando o usuário loga
  useEffect(() => {
    if (!usuario?.id) {
      setSincronizado(true);
      return;
    }
    setSincronizado(false);

    // Email sempre vem do auth; nome usa o da conta se não há customização
    setEmail(usuario.email || "");
    const nomeAuth = usuario.user_metadata?.nome ?? usuario.email?.split("@")[0] ?? "";
    setNome((prev) => prev || nomeAuth);

    supabase
      .from("dados_usuario")
      .select("*")
      .eq("user_id", usuario.id)
      .maybeSingle()
      .then(({ data }) => {
        // Monta o estado resultante do carregamento com a mesma regra usada
        // abaixo pra decidir os setState (server só sobrescreve quando tem
        // algo de fato) — vira a base de comparação pra saber se algo mudou
        // depois, em vez de gravar de novo um estado idêntico ao do banco.
        const carregado = {
          listas: (Array.isArray(data?.listas) && data.listas.length) ? data.listas : listas,
          despensa: (Array.isArray(data?.despensa) && data.despensa.length) ? data.despensa : despensa,
          historico_precos: Array.isArray(data?.historico_precos) ? data.historico_precos : historicoPrecos,
          orcamento: (typeof data?.orcamento === "number" && data.orcamento > 0) ? data.orcamento : orcamento,
          mercados: (Array.isArray(data?.mercados) && data.mercados.length) ? data.mercados : mercados,
          mercado_atual: data?.mercado_atual ?? mercadoAtual,
          notificacoes: data?.notificacoes ?? notificacoes,
          nome: data?.nome || nomeAuth,
          dark_mode: typeof data?.dark_mode === "boolean" ? data.dark_mode : darkMode,
          trial_banner_visivel: typeof data?.trial_banner_visivel === "boolean" ? data.trial_banner_visivel : trialBannerVisivel,
          boas_vindas_premium: typeof data?.boas_vindas_premium === "boolean" ? data.boas_vindas_premium : boasVindasPremium,
        };
        // Se o dispositivo tem uma edição local mais nova do que a última
        // confirmada no servidor, o save de saída pode não ter completado a
        // tempo (aba fechada rápido demais, rede instável) — nesse caso é o
        // servidor que está desatualizado, não o local. Preservar o estado
        // local e deixar o efeito de salvamento abaixo reenviá-lo assim que
        // sincronizado virar true, em vez de sobrescrever a edição da pessoa
        // com um dado mais velho vindo do servidor.
        const editadoLocalmenteEm = Number(localStorage.getItem("listamo:ultimaEdicaoLocal")) || 0;
        const servidorAtualizadoEm = data?.updated_at ? new Date(data.updated_at).getTime() : 0;
        if (data && editadoLocalmenteEm > servidorAtualizadoEm) {
          setErroSincronizacao(false);
          setSincronizado(true);
          return;
        }

        if (data) {
          setListas(carregado.listas);
          setDespensaLocal(carregado.despensa);
          setHistoricoPrecos(carregado.historico_precos);
          setOrcamento(carregado.orcamento);
          setMercados(carregado.mercados);
          setMercadoAtual(carregado.mercado_atual);
          setNotificacoes(carregado.notificacoes);
          setNome(carregado.nome);
          setDarkMode(carregado.dark_mode);
          setTrialBannerVisivel(carregado.trial_banner_visivel);
          setBoasVindasPremium(carregado.boas_vindas_premium);
        }
        ultimoSalvoRef.current = JSON.stringify(carregado);
        setErroSincronizacao(false);
        setSincronizado(true);
      })
      .catch((err) => {
        // Sem isso, uma falha de rede aqui travava sincronizado em false pro
        // resto da sessão — e como o efeito de salvamento abaixo só roda com
        // sincronizado=true, nenhuma edição feita depois chegava a ser salva.
        // Melhor seguir com o que já está no localStorage do que travar.
        console.error("[listamo] falha ao carregar dados_usuario:", err);
        setErroSincronizacao(true);
        setSincronizado(true);
      });
  }, [usuario?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Salva no Supabase sempre que dados mudam de verdade (debounced 2s) — se
  // o estado atual já bate com o que confirmamos salvo, nem agenda nada.
  useEffect(() => {
    if (!sincronizado || !usuario?.id) return;
    const dados = {
      listas,
      despensa,
      historico_precos: historicoPrecos,
      orcamento,
      mercados,
      mercado_atual: mercadoAtual,
      notificacoes,
      nome,
      dark_mode: darkMode,
      trial_banner_visivel: trialBannerVisivel,
      boas_vindas_premium: boasVindasPremium,
    };
    const assinatura = JSON.stringify(dados);
    if (assinatura === ultimoSalvoRef.current) return;

    // Carimbo síncrono (não espera o debounce/rede) — é o que permite ao
    // carregamento acima perceber que existe uma edição não confirmada no
    // servidor, mesmo que o salvamento de saída não chegue a completar.
    try { localStorage.setItem("listamo:ultimaEdicaoLocal", String(Date.now())); } catch {}

    const payload = { user_id: usuario.id, ...dados, updated_at: new Date().toISOString() };
    dadosPendentesRef.current = { payload, assinatura };
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => salvarNoSupabase(dadosPendentesRef.current), 2000);
    return () => clearTimeout(saveTimerRef.current);
  }, [sincronizado, listas, despensa, historicoPrecos, orcamento, mercados, mercadoAtual, notificacoes, nome, darkMode, trialBannerVisivel, boasVindasPremium, usuario?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function salvarNoSupabase({ payload, assinatura }, tentativa = 0) {
    dadosPendentesRef.current = null;
    supabase.from("dados_usuario").upsert(payload, { onConflict: "user_id" }).then(({ error }) => {
      if (!error) { ultimoSalvoRef.current = assinatura; setErroSincronizacao(false); return; }
      console.error("[listamo] falha ao salvar dados_usuario:", error);
      if (tentativa >= 2) { setErroSincronizacao(true); return; } // 3 tentativas no total (0, 1, 2) — desiste; a próxima edição local tenta salvar de novo
      // Mantém disponível pro salvamento forçado de saída (visibilitychange/
      // pagehide) poder tentar na hora, em vez de esperar o backoff todo.
      dadosPendentesRef.current = { payload, assinatura };
      retryTimerRef.current = setTimeout(() => salvarNoSupabase({ payload, assinatura }, tentativa + 1), 3000 * 3 ** tentativa);
    });
  }

  // No celular, sair do app (trocar de app, apagar a tela) suspende o
  // JavaScript quase instantaneamente — o debounce de 2s acima nunca chega
  // a disparar se a pessoa não ficar parada na tela esse tempo todo. Sem
  // isso, uma alteração feita e seguida de troca de app (ex.: ativar uma
  // notificação e sair) nunca era salva de verdade no servidor.
  useEffect(() => {
    function forcarSalvamento() {
      if (!dadosPendentesRef.current) return;
      clearTimeout(saveTimerRef.current);
      clearTimeout(retryTimerRef.current);
      salvarNoSupabase(dadosPendentesRef.current);
    }
    function aoMudarVisibilidade() {
      if (document.hidden) forcarSalvamento();
    }
    document.addEventListener("visibilitychange", aoMudarVisibilidade);
    window.addEventListener("pagehide", forcarSalvamento);
    return () => {
      document.removeEventListener("visibilitychange", aoMudarVisibilidade);
      window.removeEventListener("pagehide", forcarSalvamento);
    };
  }, []);

  // — Listas CRUD —
  function criarLista(nomeParam) {
    const nova = { id: `lista-${Date.now()}`, nome: nomeParam?.trim() || "Nova lista", mes: MES_ATUAL_LABEL, itens: [], criadaEm: new Date().toISOString().slice(0, 10) };
    setListas((prev) => [nova, ...prev]);
    return nova;
  }
  function atualizarItensLista(listaId, atualizador) {
    setListas((prev) => prev.map((l) => l.id !== listaId ? l : { ...l, itens: typeof atualizador === "function" ? atualizador(l.itens) : atualizador }));
  }
  function renomearLista(listaId, novoNome) {
    if (!novoNome.trim()) return;
    setListas((prev) => prev.map((l) => l.id !== listaId ? l : { ...l, nome: novoNome.trim() }));
  }
  function excluirLista(listaId) {
    setListas((prev) => prev.filter((l) => l.id !== listaId));
  }
  function finalizarCompra(listaId) {
    const lista = listas.find((l) => l.id === listaId);
    if (!lista) return 0;
    const comprados = lista.itens.filter((i) => i.status === "carrinho");
    const total = comprados.reduce((s, i) => s + i.preco * i.quantidade, 0);
    if (total <= 0) return 0;
    atualizarItensLista(listaId, (itens) => itens.filter((i) => i.status !== "carrinho"));
    // compraId identifica os itens que vieram da mesma finalização de compra
    // (data+mercado sozinhos colidiriam se a pessoa finalizar duas compras
    // no mesmo dia no mesmo mercado) — usado pra "Adicionar da última compra"
    // na despensa saber exatamente quais itens vieram juntos.
    const compraId = Date.now();
    setHistoricoPrecos((prev) => [
      ...prev,
      ...comprados.map((i) => ({ produto: i.nome, preco: i.preco, quantidade: i.quantidade, mercado: mercadoAtual, data: new Date().toISOString().slice(0, 10), compraId })),
    ]);
    return total;
  }
  function apagarMesHistorico(prefixoMes) {
    setHistoricoPrecos((prev) => prev.filter((r) => !r.data.startsWith(prefixoMes)));
  }

  function adicionarMercado(nomeBruto) {
    const novo = nomeBruto.trim();
    if (!novo) return;
    setMercados((prev) => prev.some((m) => m.toLowerCase() === novo.toLowerCase()) ? prev : [...prev, novo]);
    setMercadoAtual(novo);
  }

  // — Despensa CRUD —
  function adicionarItemDespensa(dadosItem) {
    setDespensaLocal((prev) => [...prev, { id: Date.now(), ...dadosItem }]);
  }
  function adicionarItensDespensa(itensNovos) {
    setDespensaLocal((prev) => [
      ...prev,
      ...itensNovos.map((dadosItem, i) => ({ id: Date.now() + i, ...dadosItem })),
    ]);
  }
  function editarItemDespensa(id, dados) {
    setDespensaLocal((prev) => prev.map((i) => i.id === id ? { ...i, ...dados } : i));
  }
  function removerItemDespensa(id) {
    setDespensaLocal((prev) => prev.filter((i) => i.id !== id));
  }

  const gastoMes = useMemo(
    () => historicoPrecos.filter((r) => r.data?.startsWith(MES_ATUAL_PREFIXO)).reduce((s, r) => s + r.preco * (r.quantidade ?? 1), 0),
    [historicoPrecos]
  );

  // Última compra finalizada — agrupa pelos registros que compartilham o
  // mesmo compraId (ou, para compras antigas sem compraId, mesma data +
  // mercado) — usada pelo botão "Adicionar da última compra" na despensa.
  const ultimaCompra = useMemo(() => {
    if (historicoPrecos.length === 0) return null;
    const maisRecente = [...historicoPrecos].sort((a, b) => (b.data ?? "").localeCompare(a.data ?? ""))[0];
    const doGrupo = historicoPrecos.filter((r) =>
      maisRecente.compraId ? r.compraId === maisRecente.compraId : (r.data === maisRecente.data && r.mercado === maisRecente.mercado)
    );
    return { data: maisRecente.data, mercado: maisRecente.mercado, itens: doGrupo };
  }, [historicoPrecos]);

  const value = useMemo(() => {
    const diasUsados = usuario?.created_at
      ? Math.floor((Date.now() - new Date(usuario.created_at).getTime()) / 86_400_000)
      : 0;
    const trialDiasRestantes = Math.max(0, 3 - diasUsados);
    const trialAtivo = trialDiasRestantes > 0;
    const plano = overridePlanoDev ?? planoAssinatura ?? "trial";
    // LIMITAÇÃO CONHECIDA E ACEITA (não é bug — decisão registrada em
    // auditoria): isPremium só existe aqui no frontend. A RLS de
    // dados_usuario libera leitura/escrita pra qualquer dono da própria
    // linha (auth.uid() = user_id), sem checar plano nenhum — então alguém
    // que soubesse chamar a API do Supabase diretamente (ex.: console do
    // navegador) poderia ler/escrever despensa, histórico etc. mesmo sem
    // trial ativo nem assinatura. Risco aceito conscientemente: o que
    // diferencia o Premium de verdade (push notification, scanner,
    // exportar PDF) não é bypassável só read/write direto nessa tabela, e
    // reforçar isso na RLS duplicaria a lógica de trial/premium em SQL, com
    // risco real de bloquear gente legítima por engano. Se decidirem
    // reforçar de verdade um dia, replicar esta mesma regra numa policy de
    // dados_usuario (ver comentário em supabase/migrations sobre isso).
    const isPremium = plano === "premium" || (plano === "trial" && trialAtivo);
    return {
      usuario: { nome, email, trialDiasRestantes },
      plano,
      setPlano: import.meta.env.DEV ? setOverridePlanoDev : undefined,
      sincronizado, erroSincronizacao,
      isPremium,
      trialAtivo,
      isEssencialOuMais: isPremium,
      trialBannerVisivel, setTrialBannerVisivel,
      orcamento, setOrcamento,
      listas, criarLista, atualizarItensLista, renomearLista, excluirLista,
      gastoMes, finalizarCompra,
      apagarMesHistorico,
      boasVindasPremium, setBoasVindasPremium,
      mercados, mercadoAtual, setMercadoAtual, adicionarMercado,
      historicoPrecos, ultimaCompra,
      despensa, adicionarItemDespensa, adicionarItensDespensa, editarItemDespensa, removerItemDespensa,
      darkMode, setDarkMode,
      fotoPerfil, setFotoPerfil,
      nome, setNome,
      email, setEmail,
      notificacoes, setNotificacoes,
    };
  }, [
    usuario, planoAssinatura, overridePlanoDev, sincronizado, erroSincronizacao, trialBannerVisivel, orcamento, listas, gastoMes,
    mercados, mercadoAtual, historicoPrecos, ultimaCompra, despensa,
    darkMode, fotoPerfil, nome, email, notificacoes,
    boasVindasPremium,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp deve ser usado dentro de AppProvider");
  return ctx;
}
