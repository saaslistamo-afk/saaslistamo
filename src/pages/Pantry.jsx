import { useMemo, useState, lazy, Suspense } from "react";
import { Plus, X, Archive, ScanLine, Pencil, Trash2 } from "lucide-react";
const BarcodeScanner = lazy(() => import("../components/ui/BarcodeScanner"));
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import ScanButton from "../components/ui/ScanButton";
import CategoryIcon from "../components/ui/CategoryIcon";
import { useApp } from "../context/AppContext";
import { CATEGORIAS, HOJE_MOCK, statusValidade, diasParaVencer } from "../mock/data";
import { inferirCategoria } from "../utils/categorizar";

const FILTROS = [
  { id: "todos", label: "Todos" },
  { id: "vencendo", label: "Vencendo" },
  { id: "vencido", label: "Vencidos" },
  { id: "valido", label: "Válidos" },
];

const HOJE = new Date(HOJE_MOCK);


const STATUS_INFO = {
  vencido: { tone: "rose", label: "Vencido", anel: "ring-rose-500/40" },
  vencendo: { tone: "amber", label: "Vencendo", anel: "ring-amber-500/40" },
  valido: { tone: "forest", label: "Em dia", anel: "ring-forest-500/30" },
};

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
        <Archive className="h-10 w-10 text-ink-300" />
        <h1 className="mt-4 font-display text-2xl font-semibold text-ink-900">Despensa é exclusivo do Premium</h1>
        <p className="mt-2 text-ink-600">Cadastre produtos e receba alertas antes deles vencerem.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="animate-rise flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Despensa</p>
          <h1 className="font-display text-[1.9rem] font-semibold text-ink-900">O que tem em casa</h1>
        </div>
        <div className="flex items-center gap-2">
          <ScanButton onClick={() => setScannerAberto(true)}>
            <ScanLine className="h-4 w-4" /> Escanear
          </ScanButton>
          <Button onClick={abrirNovoItem}>
            <Plus className="h-4 w-4" /> Adicionar item
          </Button>
        </div>
      </div>

      {itens.length === 0 ? (
        <div className="mx-auto flex max-w-md flex-col items-center pt-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-forest-100 text-forest-700">
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
            <div className="animate-rise mt-4 flex flex-wrap gap-2.5 text-sm">
              {contagem.vencido > 0 && <Badge tone="rose" dot>{contagem.vencido} vencido(s)</Badge>}
              {contagem.vencendo > 0 && <Badge tone="amber" dot>{contagem.vencendo} vencendo em até 3 dias</Badge>}
            </div>
          )}

          <div className="mt-5 flex gap-2 overflow-x-auto">
            {FILTROS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFiltro(f.id)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold cursor-pointer transition-colors duration-150 ${
                  filtro === f.id ? "bg-forest-700 text-cream-50" : "bg-cream-100 text-ink-600 hover:bg-cream-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtrados.map((item) => {
              const info = STATUS_INFO[item.status];
              return (
                <Card key={item.id} className={`animate-rise p-4 ring-1 ${info.anel}`}>
                  <div className="flex items-start justify-between">
                    <CategoryIcon categoria={item.categoria} />
                    <Badge tone={info.tone} dot className={item.status === "vencido" ? "animate-pulse-soft" : ""}>
                      {info.label}
                    </Badge>
                  </div>
                  <p className="mt-3 font-display text-lg font-semibold text-ink-900">{item.nomeProduto}</p>
                  <p className="mt-0.5 text-sm text-ink-500">{item.quantidade} un. · {CATEGORIAS[item.categoria]?.label}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-xs font-medium text-ink-400">
                      {item.status === "vencido"
                        ? `Venceu há ${Math.abs(item.dias)} dia(s)`
                        : `Vence em ${item.dias} dia(s)`}
                    </p>
                    <button
                      onClick={() => abrirEdicao(item)}
                      aria-label={`Editar ${item.nomeProduto}`}
                      className="cursor-pointer rounded-full p-1.5 text-ink-300 hover:bg-ink-900/5 hover:text-forest-700"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </Card>
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
          <Card className="relative w-full max-w-sm p-6">
            <button onClick={fecharModal} className="absolute right-4 top-4 cursor-pointer text-ink-400 hover:text-ink-700">
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg font-semibold text-ink-900">
                {editandoId ? "Editar item" : "Novo item na despensa"}
              </h2>
              {viaScanner && <Badge tone="forest">via scanner</Badge>}
            </div>
            <div className="mt-4 flex flex-col gap-3">
              <label>
                <span className="mb-1.5 block text-xs font-semibold text-ink-600">Produto</span>
                <input
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  placeholder="Ex.: Iogurte natural"
                  className="w-full rounded-xl border border-ink-900/10 bg-paper px-3.5 py-2.5 text-sm outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/15"
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
                    className="w-full rounded-xl border border-ink-900/10 bg-paper px-3.5 py-2.5 text-sm outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/15"
                  />
                </label>
                <label className="flex-1">
                  <span className="mb-1.5 block text-xs font-semibold text-ink-600">Data de validade</span>
                  <input
                    type="date"
                    value={novaValidade}
                    onChange={(e) => setNovaValidade(e.target.value)}
                    className="w-full rounded-xl border border-ink-900/10 bg-paper px-3.5 py-2.5 text-sm outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/15"
                  />
                </label>
              </div>
              {viaScanner && <p className="-mt-1 text-xs text-ink-400">Validade sugerida a partir do tipo de produto — confira antes de salvar.</p>}
            </div>
            <Button className="mt-5 w-full" onClick={salvarItem}>
              {editandoId ? "Salvar alterações" : "Adicionar à despensa"}
            </Button>
            {editandoId && (
              <button
                onClick={() => removerItem(editandoId)}
                className="mt-3 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-medium text-rose-600 hover:bg-rose-100/60"
              >
                <Trash2 className="h-4 w-4" /> Remover da despensa
              </button>
            )}
          </Card>
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
