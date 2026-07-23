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
    try { localStorage.setItem(chave, JSON.stringify(valor)); } catch {}
  }, [chave, valor]);
  return [valor, setValor];
}

function normalizarMorador(item) {
  return typeof item === "string" ? { nome: "", faixa: item } : item;
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
  const saveTimerRef = useRef(null);

  const [trialBannerVisivel, setTrialBannerVisivel] = usarEstadoPersistido("listamo:trialBanner", true);
  const [orcamento, setOrcamento]                   = usarEstadoPersistido("listamo:orcamento", 0);
  const [listas, setListas]                         = usarEstadoPersistido("listamo:listas", []);
  const [mercados, setMercados]                     = usarEstadoPersistido("listamo:mercados", MERCADOS_CONHECIDOS);
  const [mercadoAtual, setMercadoAtual]             = usarEstadoPersistido("listamo:mercadoAtual", MERCADOS_CONHECIDOS[0]);
  const [historicoPrecos, setHistoricoPrecos]       = usarEstadoPersistido("listamo:historicoPrecos", []);
  const [boasVindasPremium, setBoasVindasPremium]   = usarEstadoPersistido("listamo:boasVindas", false);
  const [despensa, setDespensaLocal]                = usarEstadoPersistido("listamo:despensa", []);
  const [faixasIdade, setFaixasIdade]               = usarEstadoPersistido("listamo:faixasIdade", []);
  const [restricoesAlimentares, setRestricoesAlimentares] = usarEstadoPersistido("listamo:restricoes", []);
  const [darkMode, setDarkMode]     = usarEstadoPersistido("listamo:darkMode", false);
  const [fotoPerfil, setFotoPerfil] = usarEstadoPersistido("listamo:fotoPerfil", null);
  const [nome, setNome]             = usarEstadoPersistido("listamo:nome", "");
  const [email, setEmail]           = usarEstadoPersistido("listamo:email", "");
  const [notificacoes, setNotificacoes] = usarEstadoPersistido("listamo:notificacoes", {
    validade: false, resumoDiario: false, orcamento: false,
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
        if (data) {
          if (Array.isArray(data.listas) && data.listas.length)           setListas(data.listas);
          if (Array.isArray(data.despensa) && data.despensa.length)       setDespensaLocal(data.despensa);
          if (Array.isArray(data.historico_precos))                       setHistoricoPrecos(data.historico_precos);
          if (typeof data.orcamento === "number" && data.orcamento > 0)  setOrcamento(data.orcamento);
          if (Array.isArray(data.mercados) && data.mercados.length)      setMercados(data.mercados);
          if (data.mercado_atual)                                         setMercadoAtual(data.mercado_atual);
          if (data.notificacoes)                                          setNotificacoes(data.notificacoes);
          if (Array.isArray(data.faixas_idade))                          setFaixasIdade(data.faixas_idade.map(normalizarMorador));
          if (Array.isArray(data.restricoes))                            setRestricoesAlimentares(data.restricoes);
        }
        setSincronizado(true);
      });
  }, [usuario?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Salva no Supabase sempre que dados mudam (debounced 2s)
  useEffect(() => {
    if (!sincronizado || !usuario?.id) return;
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      supabase.from("dados_usuario").upsert({
        user_id: usuario.id,
        listas,
        despensa,
        historico_precos: historicoPrecos,
        orcamento,
        mercados,
        mercado_atual: mercadoAtual,
        notificacoes,
        faixas_idade: faixasIdade,
        restricoes: restricoesAlimentares,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    }, 2000);
    return () => clearTimeout(saveTimerRef.current);
  }, [sincronizado, listas, despensa, historicoPrecos, orcamento, mercados, mercadoAtual, notificacoes, faixasIdade, restricoesAlimentares, usuario?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
    const isPremium = plano === "premium" || (plano === "trial" && trialAtivo);
    return {
      usuario: { nome, email, trialDiasRestantes, perfilCasa: { faixasIdade, restricoes: restricoesAlimentares } },
      plano,
      setPlano: import.meta.env.DEV ? setOverridePlanoDev : undefined,
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
      faixasIdade, setFaixasIdade,
      restricoesAlimentares, setRestricoesAlimentares,
      darkMode, setDarkMode,
      fotoPerfil, setFotoPerfil,
      nome, setNome,
      email, setEmail,
      notificacoes, setNotificacoes,
    };
  }, [
    usuario, planoAssinatura, overridePlanoDev, trialBannerVisivel, orcamento, listas, gastoMes,
    mercados, mercadoAtual, historicoPrecos, ultimaCompra, despensa,
    faixasIdade, restricoesAlimentares, darkMode, fotoPerfil, nome, email, notificacoes,
    boasVindasPremium,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp deve ser usado dentro de AppProvider");
  return ctx;
}
