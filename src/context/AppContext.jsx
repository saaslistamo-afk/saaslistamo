import { createContext, useContext, useState, useMemo, useEffect } from "react";
import { USUARIO, LISTA_ATIVA, MERCADOS_CONHECIDOS, HISTORICO_PRECOS, DESPENSA, HOJE_MOCK } from "../mock/data";

const MES_ATUAL_LABEL   = "Junho 2026";
const MES_ATUAL_PREFIXO = HOJE_MOCK.slice(0, 7);

const AppContext   = createContext(null);
const ORDEM_PLANOS = ["premium"];

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
  const [plano, setPlano] = useState("trial");
  const [trialBannerVisivel, setTrialBannerVisivel] = usarEstadoPersistido("listamo:trialBanner", true);
  const [orcamento, setOrcamento]                   = usarEstadoPersistido("listamo:orcamento", LISTA_ATIVA.orcamentoDefinido);
  const [listas, setListas]                         = usarEstadoPersistido("listamo:listas", [LISTA_ATIVA]);
  const [mercados, setMercados]                     = usarEstadoPersistido("listamo:mercados", MERCADOS_CONHECIDOS);
  const [mercadoAtual, setMercadoAtual]             = usarEstadoPersistido("listamo:mercadoAtual", MERCADOS_CONHECIDOS[0]);
  const [historicoPrecos, setHistoricoPrecos]       = usarEstadoPersistido("listamo:historicoPrecos", HISTORICO_PRECOS);
  const [mesesApagados, setMesesApagados]           = usarEstadoPersistido("listamo:mesesApagados", []);
  const [boasVindasPremium, setBoasVindasPremium]   = usarEstadoPersistido("listamo:boasVindas", false);
  const [despensa, setDespensaLocal]                = usarEstadoPersistido("listamo:despensa", DESPENSA);
  const [faixasIdade, setFaixasIdade]               = usarEstadoPersistido("listamo:faixasIdade", USUARIO.perfilCasa.faixasIdade.map(normalizarMorador));
  const [restricoesAlimentares, setRestricoesAlimentares] = usarEstadoPersistido("listamo:restricoes", USUARIO.perfilCasa.restricoes);
  const [darkMode, setDarkMode]     = usarEstadoPersistido("listamo:darkMode", false);
  const [fotoPerfil, setFotoPerfil] = usarEstadoPersistido("listamo:fotoPerfil", null);
  const [nome, setNome]             = usarEstadoPersistido("listamo:nome", USUARIO.nome);
  const [email, setEmail]           = usarEstadoPersistido("listamo:email", USUARIO.email);
  const [notificacoes, setNotificacoes] = usarEstadoPersistido("listamo:notificacoes", {
    validade: true, resumoDiario: true, orcamento: true,
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // — Listas CRUD —
  function criarLista(nomeParam) {
    const nova = { id: `lista-${Date.now()}`, nome: nomeParam?.trim() || "Nova lista", mes: MES_ATUAL_LABEL, itens: [], criadaEm: HOJE_MOCK };
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
    setHistoricoPrecos((prev) => [
      ...prev,
      ...comprados.map((i) => ({ produto: i.nome, preco: i.preco, quantidade: i.quantidade, mercado: mercadoAtual, data: HOJE_MOCK })),
    ]);
    return total;
  }
  function apagarMesHistorico(labelMes, prefixoMes) {
    if (prefixoMes) {
      // mês real — remove entradas do historicoPrecos
      setHistoricoPrecos((prev) => prev.filter((r) => !r.data.startsWith(prefixoMes)));
    } else {
      // mês seed — adiciona à lista de apagados
      setMesesApagados((prev) => prev.includes(labelMes) ? prev : [...prev, labelMes]);
    }
  }

  function adicionarMercado(nomeBruto) {
    const novo = nomeBruto.trim();
    if (!novo) return;
    setMercados((prev) => prev.some((m) => m.toLowerCase() === novo.toLowerCase()) ? prev : [...prev, novo]);
    setMercadoAtual(novo);
  }

  // — Despensa CRUD —
  function adicionarItemDespensa(dadosItem) {
    const novoItem = { id: Date.now(), ...dadosItem };
    setDespensaLocal((prev) => [...prev, novoItem]);
  }
  function editarItemDespensa(id, dados) {
    setDespensaLocal((prev) => prev.map((i) => i.id === id ? { ...i, ...dados } : i));
  }
  function removerItemDespensa(id) {
    setDespensaLocal((prev) => prev.filter((i) => i.id !== id));
  }

  // — Reset de dados —
  function resetarDadosDemo() {
    setListas([LISTA_ATIVA]);
    setHistoricoPrecos(HISTORICO_PRECOS);
    setDespensaLocal(DESPENSA);
    setMercados(MERCADOS_CONHECIDOS);
    setMercadoAtual(MERCADOS_CONHECIDOS[0]);
    setFaixasIdade(USUARIO.perfilCasa.faixasIdade.map(normalizarMorador));
    setRestricoesAlimentares(USUARIO.perfilCasa.restricoes);
  }

  const gastoMes = useMemo(
    () => historicoPrecos.filter((r) => r.data.startsWith(MES_ATUAL_PREFIXO)).reduce((s, r) => s + r.preco * (r.quantidade ?? 1), 0),
    [historicoPrecos]
  );

  const value = useMemo(() => {
    const isPremium = plano === "trial" || plano === "premium";
    return {
      usuario: { nome, email, trialDiasRestantes: 3, perfilCasa: { faixasIdade, restricoes: restricoesAlimentares } },
      plano, setPlano,
      isPremium,
      isEssencialOuMais: isPremium,
      trialBannerVisivel, setTrialBannerVisivel,
      orcamento, setOrcamento,
      listas, criarLista, atualizarItensLista, renomearLista, excluirLista,
      gastoMes, finalizarCompra,
      mesesApagados, apagarMesHistorico,
      boasVindasPremium, setBoasVindasPremium,
      mercados, mercadoAtual, setMercadoAtual, adicionarMercado,
      resetarDadosDemo,
      historicoPrecos,
      despensa, adicionarItemDespensa, editarItemDespensa, removerItemDespensa,
      faixasIdade, setFaixasIdade,
      restricoesAlimentares, setRestricoesAlimentares,
      darkMode, setDarkMode,
      fotoPerfil, setFotoPerfil,
      nome, setNome,
      email, setEmail,
      notificacoes, setNotificacoes,
    };
  }, [
    plano, trialBannerVisivel, orcamento, listas, gastoMes,
    mercados, mercadoAtual, historicoPrecos, despensa,
    faixasIdade, restricoesAlimentares, darkMode, fotoPerfil, nome, email, notificacoes,
    mesesApagados, boasVindasPremium,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp deve ser usado dentro de AppProvider");
  return ctx;
}
