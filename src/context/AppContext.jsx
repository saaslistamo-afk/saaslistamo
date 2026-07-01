import { createContext, useContext, useState, useMemo, useEffect } from "react";
import {
  doc, collection, onSnapshot, setDoc, updateDoc,
  deleteDoc, addDoc, getDocs,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "./AuthContext";
import { MERCADOS_CONHECIDOS, HOJE_MOCK } from "../mock/data";

const MES_ATUAL_LABEL  = "Junho 2026";
const MES_ATUAL_PREFIXO = HOJE_MOCK.slice(0, 7); // "2026-06"

const AppContext  = createContext(null);
// único plano pago — acesso total ao app
const ORDEM_PLANOS = ["premium"];

// preferências de UI ficam no localStorage — não são dados do usuário
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

const PERFIL_PADRAO = {
  plano: "trial",
  trialDiasRestantes: 3,
  nome: "",
  email: "",
  orcamento: 850,
  notificacoes: { validade: true, resumoDiario: true, orcamento: true },
  mercados: MERCADOS_CONHECIDOS,
  mercadoAtual: MERCADOS_CONHECIDOS[0],
  faixasIdade: [],
  restricoesAlimentares: [],
  trialBannerVisivel: true,
};

export function AppProvider({ children }) {
  const { usuario: authUser } = useAuth();
  const uid = authUser?.uid ?? null;

  const [carregando, setCarregando] = useState(true);

  // campos do perfil (vêm do Firestore)
  const [plano,                  setPlano]                  = useState("trial"); // setPlano = local-only (seletor de demo)
  const [trialBannerVisivel,     setTrialBannerVisivelLocal] = useState(true);
  const [trialDiasRestantes,     setTrialDiasRestantes]      = useState(3);
  const [nome,                   setNomeLocal]               = useState("");
  const [email,                  setEmailLocal]              = useState("");
  const [orcamento,              setOrcamentoLocal]          = useState(850);
  const [notificacoes,           setNotificacoesLocal]       = useState(PERFIL_PADRAO.notificacoes);
  const [mercados,               setMercadosLocal]           = useState(MERCADOS_CONHECIDOS);
  const [mercadoAtual,           setMercadoAtualLocal]       = useState(MERCADOS_CONHECIDOS[0]);
  const [faixasIdade,            setFaixasIdadeLocal]        = useState([]);
  const [restricoesAlimentares,  setRestricoesLocal]         = useState([]);

  // coleções (vêm do Firestore)
  const [listas,          setListas]          = useState([]);
  const [despensa,        setDespensa]        = useState([]);
  const [historicoPrecos, setHistoricoPrecos] = useState([]);

  // preferências de UI (localStorage)
  const [darkMode,   setDarkMode]   = usarEstadoPersistido("listamo:darkMode",   false);
  const [fotoPerfil, setFotoPerfil] = usarEstadoPersistido("listamo:fotoPerfil", null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // helper: escreve campos no documento de perfil do usuário
  function syncPerfil(campos) {
    if (!uid) return;
    updateDoc(doc(db, "usuarios", uid), campos).catch(console.error);
  }

  // setters com sync automático pro Firestore
  function setNome(v)      { setNomeLocal(v);      syncPerfil({ nome: v }); }
  function setEmail(v)     { setEmailLocal(v);     syncPerfil({ email: v }); }
  function setOrcamento(v) { setOrcamentoLocal(v); syncPerfil({ orcamento: v }); }
  function setNotificacoes(fn) {
    setNotificacoesLocal((prev) => {
      const novo = typeof fn === "function" ? fn(prev) : fn;
      syncPerfil({ notificacoes: novo });
      return novo;
    });
  }
  function setFaixasIdade(v)           { setFaixasIdadeLocal(v); syncPerfil({ faixasIdade: v }); }
  function setRestricoesAlimentares(v) { setRestricoesLocal(v);  syncPerfil({ restricoesAlimentares: v }); }
  function setMercadoAtual(v)          { setMercadoAtualLocal(v); syncPerfil({ mercadoAtual: v }); }
  function setTrialBannerVisivel(v)    { setTrialBannerVisivelLocal(v); syncPerfil({ trialBannerVisivel: v }); }

  // — listeners do Firestore —
  useEffect(() => {
    if (!uid) { setCarregando(false); return; }
    setCarregando(true);

    const subs = [];
    const perfilRef = doc(db, "usuarios", uid);

    // perfil do usuário — libera a tela assim que chegar
    subs.push(onSnapshot(perfilRef, (snap) => {
      if (!snap.exists()) {
        setDoc(perfilRef, {
          ...PERFIL_PADRAO,
          email: authUser?.email ?? "",
          nome:  authUser?.displayName ?? "",
        }).catch(console.error);
        // novo usuário: libera imediatamente com os padrões
        setCarregando(false);
        return;
      }
      const d = snap.data();
      setPlano(d.plano ?? "trial");
      setTrialDiasRestantes(d.trialDiasRestantes ?? 3);
      setNomeLocal(d.nome ?? "");
      setEmailLocal(d.email ?? authUser?.email ?? "");
      setOrcamentoLocal(d.orcamento ?? 850);
      setNotificacoesLocal(d.notificacoes ?? PERFIL_PADRAO.notificacoes);
      setMercadosLocal(d.mercados ?? MERCADOS_CONHECIDOS);
      setMercadoAtualLocal(d.mercadoAtual ?? MERCADOS_CONHECIDOS[0]);
      setFaixasIdadeLocal((d.faixasIdade ?? []).map(normalizarMorador));
      setRestricoesLocal(d.restricoesAlimentares ?? []);
      setTrialBannerVisivelLocal(d.trialBannerVisivel ?? true);
      // libera a tela assim que o perfil chega — o resto carrega em segundo plano
      setCarregando(false);
    }));

    // listas
    subs.push(onSnapshot(collection(db, "usuarios", uid, "listas"), (snap) => {
      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      arr.sort((a, b) => new Date(b.criadaEm) - new Date(a.criadaEm));
      setListas(arr);
    }));

    // despensa
    subs.push(onSnapshot(collection(db, "usuarios", uid, "despensa"), (snap) => {
      setDespensa(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }));

    // historicoPrecos
    subs.push(onSnapshot(collection(db, "usuarios", uid, "historicoPrecos"), (snap) => {
      setHistoricoPrecos(snap.docs.map((d) => d.data()));
    }));

    return () => subs.forEach((u) => u());
  }, [uid]);

  // — CRUD listas —
  function criarLista(nomeParam) {
    if (!uid) return null;
    const ref  = doc(collection(db, "usuarios", uid, "listas"));
    const nova = { id: ref.id, nome: nomeParam?.trim() || "Nova lista", mes: MES_ATUAL_LABEL, itens: [], criadaEm: HOJE_MOCK };
    setListas((prev) => [nova, ...prev]);
    const { id: _id, ...dados } = nova;
    setDoc(ref, dados).catch(console.error);
    return nova;
  }

  function atualizarItensLista(listaId, atualizador) {
    if (!uid) return;
    setListas((prev) =>
      prev.map((l) => {
        if (l.id !== listaId) return l;
        const novosItens = typeof atualizador === "function" ? atualizador(l.itens) : atualizador;
        const atualizada = { ...l, itens: novosItens };
        const { id: _id, ...dados } = atualizada;
        setDoc(doc(db, "usuarios", uid, "listas", listaId), dados).catch(console.error);
        return atualizada;
      })
    );
  }

  function renomearLista(listaId, novoNome) {
    if (!novoNome.trim() || !uid) return;
    setListas((prev) =>
      prev.map((l) => {
        if (l.id !== listaId) return l;
        const atualizada = { ...l, nome: novoNome.trim() };
        const { id: _id, ...dados } = atualizada;
        setDoc(doc(db, "usuarios", uid, "listas", listaId), dados).catch(console.error);
        return atualizada;
      })
    );
  }

  function excluirLista(listaId) {
    if (!uid) return;
    setListas((prev) => prev.filter((l) => l.id !== listaId));
    deleteDoc(doc(db, "usuarios", uid, "listas", listaId)).catch(console.error);
  }

  function finalizarCompra(listaId) {
    const lista = listas.find((l) => l.id === listaId);
    if (!lista || !uid) return 0;
    const comprados = lista.itens.filter((i) => i.status === "carrinho");
    const total     = comprados.reduce((s, i) => s + i.preco * i.quantidade, 0);
    if (total <= 0) return 0;
    atualizarItensLista(listaId, (itens) => itens.filter((i) => i.status !== "carrinho"));
    const novos = comprados.map((i) => ({
      produto: i.nome, preco: i.preco, quantidade: i.quantidade,
      mercado: mercadoAtual, data: HOJE_MOCK,
    }));
    setHistoricoPrecos((prev) => [...prev, ...novos]);
    const colRef = collection(db, "usuarios", uid, "historicoPrecos");
    novos.forEach((r) => addDoc(colRef, r).catch(console.error));
    return total;
  }

  function adicionarMercado(nomeBruto) {
    const novo = nomeBruto.trim();
    if (!novo || !uid) return;
    setMercadosLocal((prev) => {
      if (prev.some((m) => m.toLowerCase() === novo.toLowerCase())) return prev;
      const atualizado = [...prev, novo];
      syncPerfil({ mercados: atualizado, mercadoAtual: novo });
      return atualizado;
    });
    setMercadoAtualLocal(novo);
  }

  // — CRUD despensa —
  function adicionarItemDespensa(dadosItem) {
    if (!uid) return;
    const ref      = doc(collection(db, "usuarios", uid, "despensa"));
    const novoItem = { id: ref.id, ...dadosItem };
    setDespensa((prev) => [...prev, novoItem]);
    const { id: _id, ...dados } = novoItem;
    setDoc(ref, dados).catch(console.error);
  }

  function editarItemDespensa(id, dados) {
    if (!uid) return;
    setDespensa((prev) => prev.map((i) => (i.id === id ? { ...i, ...dados } : i)));
    const { id: _id, ...dadosSemId } = dados;
    updateDoc(doc(db, "usuarios", uid, "despensa", id), dadosSemId).catch(console.error);
  }

  function removerItemDespensa(id) {
    if (!uid) return;
    setDespensa((prev) => prev.filter((i) => i.id !== id));
    deleteDoc(doc(db, "usuarios", uid, "despensa", id)).catch(console.error);
  }

  // — Reset de dados (ferramenta de desenvolvimento) —
  async function resetarDadosDemo() {
    if (!uid) return;
    // apaga todos os documentos das subcoleções no Firestore
    for (const colNome of ["listas", "despensa", "historicoPrecos"]) {
      const snap = await getDocs(collection(db, "usuarios", uid, colNome));
      await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
    }
    // restaura o perfil com os padrões
    await setDoc(doc(db, "usuarios", uid), {
      ...PERFIL_PADRAO,
      email: authUser?.email ?? "",
      nome:  authUser?.displayName ?? "",
    });
    // estado local limpo imediatamente (os listeners vão confirmar)
    setListas([]);
    setDespensa([]);
    setHistoricoPrecos([]);
  }

  // gasto do mês sempre derivado do histórico real
  const gastoMes = useMemo(
    () =>
      historicoPrecos
        .filter((r) => r.data.startsWith(MES_ATUAL_PREFIXO))
        .reduce((s, r) => s + r.preco * (r.quantidade ?? 1), 0),
    [historicoPrecos]
  );

  const value = useMemo(() => {
    // trial e premium têm acesso completo; qualquer outro estado não tem
    const isPremium = plano === "trial" || plano === "premium";
    return {
      carregando,
      usuario: { nome, email, trialDiasRestantes, perfilCasa: { faixasIdade, restricoes: restricoesAlimentares } },
      plano, setPlano,
      isPremium,
      isEssencialOuMais: isPremium, // mantido por compatibilidade — mesmo valor que isPremium
      trialBannerVisivel, setTrialBannerVisivel,
      orcamento, setOrcamento,
      listas, criarLista, atualizarItensLista, renomearLista, excluirLista,
      gastoMes, finalizarCompra,
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
    carregando, plano, trialBannerVisivel, trialDiasRestantes, orcamento, listas, gastoMes,
    mercados, mercadoAtual, historicoPrecos, despensa,
    faixasIdade, restricoesAlimentares, darkMode, fotoPerfil, nome, email, notificacoes,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp deve ser usado dentro de AppProvider");
  return ctx;
}
