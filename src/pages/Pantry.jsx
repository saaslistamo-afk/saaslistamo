import { useMemo, useState, lazy, Suspense } from "react";
import { Plus, X, Archive, ScanLine, Pencil, Trash2 } from "lucide-react";
const BarcodeScanner = lazy(() => import("../components/ui/BarcodeScanner"));
import Button from "../components/ui/Button";
import ScanButton from "../components/ui/ScanButton";
import CategoryIcon from "../components/ui/CategoryIcon";
import { useApp } from "../context/AppContext";
import { CATEGORIAS, statusValidade, diasParaVencer } from "../mock/data";
import { inferirCategoria } from "../utils/categorizar";
import { cn } from "../utils/cn";

const FILTROS = [
  { id: "todos", label: "Todos" },
  { id: "vencendo", label: "Vencendo" },
  { id: "vencido", label: "Vencidos" },
  { id: "valido", label: "Válidos" },
];

const HOJE = new Date();

export default function Pantry() {
  const { isPremium, despensa: itens, adicionarItemDespensa, editarItemDespensa, removerItemDespensa } = useApp();
  const [filtro, setFiltro] = useState("todos");
  const [modalAberto, setModalAberto] = useState(false);
  const [scannerAberto, setScannerAberto] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novaValidade, setNovaValidade] = useState("");
  const [novaQuantidade, setNovaQuantidade] = useState(1);
  const [viaScanner, setViaScanner] = useState(false);
  const [editandoId, setEditandoId] = useState(null);

  const processados = useMemo(
    () =>
      itens
        .map((i) => ({ ...i, status: statusValidade(i.dataValidade), dias: diasParaVencer(i.dataValidade) }))
        .sort((a, b) => a.dias - b.dias),
    [itens]
  );

  const filtrados = filtro === "todos" ? processados : processados.filter((i) => i.status === filtro);
  const contagem = {
    vencendo: processados.filter((i) => i.status === "vencendo").length,
    vencido: processados.filter((i) => i.status === "vencido").length,
  };

  function fecharModal() {
    setModalAberto(false);
    setEditandoId(null);
    setNovoNome("");
    setNovaValidade("");
    setNovaQuantidade(1);
    setViaScanner(false);
  }

  function abrirNovoItem() {
    setEditandoId(null);
    setNovoNome("");
    setNovaValidade("");
    setNovaQuantidade(1);
    setViaScanner(false);
    setModalAberto(true);
  }

  function abrirEdicao(item) {
    setEditandoId(item.id);
    setNovoNome(item.nomeProduto);
    setNovaValidade(item.dataValidade);
    setNovaQuantidade(item.quantidade);
    setViaScanner(false);
    setModalAberto(true);
  }

  function salvarItem() {
    if (!novoNome.trim()) return;
    const quantidade = Number(novaQuantidade) || 1;
    if (editandoId) {
      editarItemDespensa(editandoId, {
        nomeProduto: novoNome,
        dataValidade: novaValidade,
        quantidade,
        categoria: inferirCategoria(novoNome),
      });
    } else {
      adicionarItemDespensa({
        nomeProduto: novoNome,
        quantidade,
        dataValidade: novaValidade,
        categoria: inferirCategoria(novoNome),
      });
    }
    fecharModal();
  }

  function removerItem(id) {
    removerItemDespensa(id);
    fecharModal();
  }

  function aoReceberProdutoEscaneado({ nome }) {
    setScannerAberto(false);
    setEditandoId(null);
    setNovoNome(nome || "");
    // pré-preenche com 30 dias à frente — usuário pode ajustar
    const daqui30 = new Date(HOJE);
    daqui30.setDate(daqui30.getDate() + 30);
    setNovaValidade(daqui30.toISOString().slice(0, 10));
    setNovaQuantidade(1);
    setViaScanner(true);
    setModalAberto(true);
  }

  if (!isPremium) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center pt-20 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-ink-300 to-ink-400 text-cream-50 shadow-soft">
          <Archive className="h-7 w-7" />
        </span>
        <h1 className="mt-4 font-display text-2xl font-semibold text-ink-900">Despensa é exclusivo do Premium</h1>
        <p className="mt-2 text-ink-600">Cadastre produtos e receba alertas antes deles vencerem.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="animate-rise flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-forest-600 to-forest-900 text-cream-50 shadow-soft">
            <Archive className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Despensa</p>
            <h1 className="font-display text-[2rem] font-semibold tracking-tight text-ink-900 sm:text-[2.2rem]">O que tem em casa</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ScanButton className="rounded-full" onClick={() => setScannerAberto(true)}>
            <ScanLine className="h-4 w-4" /> Escanear
          </ScanButton>
          <Button className="rounded-full" onClick={abrirNovoItem}>
            <Plus className="h-4 w-4" /> Adicionar item
          </Button>
        </div>
      </div>

      {itens.length === 0 ? (
        <div className="mx-auto flex max-w-md flex-col items-center pt-16 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-forest-500 to-forest-800 text-cream-50 shadow-soft">
            <Archive className="h-7 w-7" />
          </span>
          <h1 className="animate-rise mt-5 font-display text-2xl font-semibold text-ink-900">Você ainda não tem itens na despensa</h1>
          <p className="animate-rise mt-2 text-ink-600" style={{ animationDelay: "40ms" }}>
            Adicione os produtos que você compra para acompanhar a validade e receber alertas antes deles vencerem.
          </p>
        </div>
      ) : (
        <>
          {(contagem.vencido > 0 || contagem.vencendo > 0) && (
            <div className="animate-rise mt-4 flex flex-wrap gap-2.5">
              {contagem.vencido > 0 && (
                <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-rose-700 px-3.5 py-1.5 text-sm font-semibold text-cream-50 shadow-soft-sm">
                  <span className="h-1.5 w-1.5 shrink-0 animate-pulse-soft rounded-full bg-cream-50" />
                  {contagem.vencido} vencido(s)
                </div>
              )}
              {contagem.vencendo > 0 && (
                <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 px-3.5 py-1.5 text-sm font-semibold text-cream-50 shadow-soft-sm">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-cream-50" />
                  {contagem.vencendo} vencendo em até 3 dias
                </div>
              )}
            </div>
          )}

          <div className="mt-5 flex gap-2 overflow-x-auto">
            {FILTROS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFiltro(f.id)}
                className={cn(
                  "shrink-0 cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200",
                  filtro === f.id
                    ? "bg-gradient-to-r from-forest-600 to-forest-800 text-cream-50 shadow-soft"
                    : "bg-paper text-ink-600 shadow-soft-sm hover:bg-cream-200"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtrados.map((item, i) => {
              const urgente = item.status !== "valido";
              return (
                <div
                  key={item.id}
                  className={cn(
                    "animate-rise relative overflow-hidden rounded-2xl p-4 shadow-soft-sm",
                    item.status === "vencido"
                      ? "bg-gradient-to-br from-rose-500 to-rose-700"
                      : item.status === "vencendo"
                      ? "bg-gradient-to-br from-amber-400 to-amber-600"
                      : "border border-ink-900/[0.06] bg-paper"
                  )}
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <span className={cn("flex h-10 w-10 items-center justify-center rounded-full", urgente && "bg-cream-50/20")}>
                      <CategoryIcon categoria={item.categoria} />
                    </span>
                    <button
                      onClick={() => abrirEdicao(item)}
                      aria-label={`Editar ${item.nomeProduto}`}
                      className={cn(
                        "flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors",
                        urgente ? "bg-cream-50/15 text-cream-50 hover:bg-cream-50/25" : "text-ink-300 hover:bg-ink-900/5 hover:text-forest-700"
                      )}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className={cn("mt-3 font-display text-lg font-semibold", urgente ? "text-cream-50" : "text-ink-900")}>{item.nomeProduto}</p>
                  <p className={cn("mt-0.5 text-sm", urgente ? "text-cream-50/85" : "text-ink-500")}>
                    {item.quantidade} un. · {CATEGORIAS[item.categoria]?.label}
                  </p>
                  <p className={cn("mt-2.5 inline-block rounded-full px-2.5 py-1 text-xs font-semibold", urgente ? "bg-cream-50/20 text-cream-50" : "bg-cream-100 text-ink-500")}>
                    {item.status === "vencido"
                      ? `Venceu há ${Math.abs(item.dias)} dia(s)`
                      : `Vence em ${item.dias} dia(s)`}
                  </p>
                </div>
              );
            })}
            {filtrados.length === 0 && (
              <p className="col-span-full py-10 text-center text-sm text-ink-400">Nenhum item nesse filtro.</p>
            )}
          </div>
        </>
      )}

      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-[1.75rem] bg-paper p-6 shadow-lift">
            <button
              onClick={fecharModal}
              aria-label="Fechar"
              className="absolute right-4 top-4 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-ink-900/5 text-ink-500 hover:bg-ink-900/10 hover:text-ink-700"
            >
              <X className="h-4.5 w-4.5" />
            </button>
            <div className="flex flex-wrap items-center gap-2 pr-10">
              <h2 className="font-display text-xl font-semibold text-ink-900">
                {editandoId ? "Editar item" : "Novo item na despensa"}
              </h2>
              {viaScanner && (
                <span className="rounded-full bg-forest-100 px-2.5 py-1 text-xs font-semibold text-forest-700">via scanner</span>
              )}
            </div>
            <div className="mt-5 flex flex-col gap-3">
              <label>
                <span className="mb-1.5 block text-xs font-semibold text-ink-600">Produto</span>
                <input
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  placeholder="Ex.: Iogurte natural"
                  className="w-full rounded-2xl border border-ink-900/10 bg-cream-100 px-4 py-3 text-sm outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/15"
                />
              </label>
              <div className="flex gap-3">
                <label className="w-24">
                  <span className="mb-1.5 block text-xs font-semibold text-ink-600">Qtd.</span>
                  <input
                    type="number"
                    min="1"
                    value={novaQuantidade}
                    onChange={(e) => setNovaQuantidade(e.target.value)}
                    className="w-full rounded-2xl border border-ink-900/10 bg-cream-100 px-4 py-3 text-sm outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/15"
                  />
                </label>
                <label className="flex-1">
                  <span className="mb-1.5 block text-xs font-semibold text-ink-600">Data de validade</span>
                  <input
                    type="date"
                    value={novaValidade}
                    onChange={(e) => setNovaValidade(e.target.value)}
                    className="w-full rounded-2xl border border-ink-900/10 bg-cream-100 px-4 py-3 text-sm outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/15"
                  />
                </label>
              </div>
              {viaScanner && <p className="-mt-1 text-xs text-ink-400">Validade sugerida a partir do tipo de produto — confira antes de salvar.</p>}
            </div>
            <Button className="mt-5 w-full rounded-full" size="lg" onClick={salvarItem}>
              {editandoId ? "Salvar alterações" : "Adicionar à despensa"}
            </Button>
            {editandoId && (
              <button
                onClick={() => removerItem(editandoId)}
                className="mt-3 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-full py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-100/60"
              >
                <Trash2 className="h-4 w-4" /> Remover da despensa
              </button>
            )}
          </div>
        </div>
      )}

      {scannerAberto && (
        <Suspense fallback={null}>
          <BarcodeScanner
            onScan={aoReceberProdutoEscaneado}
            onCancelar={() => setScannerAberto(false)}
          />
        </Suspense>
      )}
    </div>
  );
}
