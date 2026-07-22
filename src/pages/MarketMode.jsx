import { useState } from "react";
import {
  Check, ScanLine, PartyPopper, Store, ChevronDown, Plus,
  ShoppingCart, ArrowLeft, ListPlus,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import ScanButton from "../components/ui/ScanButton";
import CategoryIcon from "../components/ui/CategoryIcon";
import { useApp } from "../context/AppContext";
import { inferirCategoria } from "../utils/categorizar";
import { encontrarMelhorCorrespondencia } from "../utils/correspondencia";
import { lazy, Suspense } from "react";
const BarcodeScanner = lazy(() => import("../components/ui/BarcodeScanner"));

const LIMIAR_CONFIANTE = 0.85;

function formatBRL(v) {
  return `R$ ${v.toFixed(2).replace(".", ",")}`;
}

export default function MarketMode() {
  const { listas } = useApp();
  const location = useLocation();
  const [listaSelecionadaId, setListaSelecionadaId] = useState(location.state?.listaId ?? null);

  const listaAtiva = listas.find((l) => l.id === listaSelecionadaId);

  if (!listaAtiva) {
    return <SeletorParaComprar listas={listas} onIniciar={(id) => setListaSelecionadaId(id)} />;
  }

  return <SessaoDeCompra lista={listaAtiva} onTrocarLista={() => setListaSelecionadaId(null)} />;
}

function SeletorParaComprar({ listas, onIniciar }) {
  const navigate = useNavigate();
  const listasComItens = listas.filter((l) => l.itens.length > 0);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-md flex-col items-center justify-center text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-forest-700 text-cream-50 shadow-soft">
        <ShoppingCart className="h-7 w-7" />
      </span>
      <h1 className="mt-5 font-display text-3xl font-semibold text-ink-900">Pronto pra fazer compras?</h1>
      <p className="mt-2 text-ink-600">Escolha qual lista você vai levar pro mercado.</p>

      {listasComItens.length === 0 ? (
        <Card className="animate-rise mt-6 w-full p-6">
          <p className="text-sm text-ink-500">Você ainda não tem listas com itens suficientes. Monte sua lista de compras para começar a usar o modo mercado.</p>
          <Button className="mt-4 w-full" onClick={() => navigate("/nova-lista")}>
            <ListPlus className="h-4 w-4" /> Montar uma lista
          </Button>
        </Card>
      ) : (
        <div className="mt-6 flex w-full flex-col gap-3">
          {listasComItens.map((lista, i) => {
            const noCarrinho = lista.itens.filter((it) => it.status === "carrinho").length;
            return (
              <button
                key={lista.id}
                onClick={() => onIniciar(lista.id)}
                className="animate-rise flex w-full cursor-pointer items-center gap-4 rounded-2xl border-2 border-forest-500/30 bg-forest-100/40 p-5 text-left transition-colors duration-150 hover:bg-forest-100/70"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-forest-700 text-cream-50 shadow-soft">
                  <ShoppingCart className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-lg font-semibold text-ink-900">Iniciar {lista.nome}</p>
                  <p className="text-sm text-ink-600">{lista.itens.length} itens · {noCarrinho} no carrinho</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SessaoDeCompra({ lista, onTrocarLista }) {
  const {
    isPremium, atualizarItensLista, finalizarCompra,
    mercados, mercadoAtual, setMercadoAtual, adicionarMercado,
  } = useApp();
  const itens = lista.itens;
  const [scannerAberto, setScannerAberto] = useState(false);
  const [etapaScanner, setEtapaScanner] = useState("scanner"); // "scanner" | "confirmar" | "extra"
  const [itemSugerido, setItemSugerido] = useState(null);
  const [nomeEscaneado, setNomeEscaneado] = useState("");
  const [nomeExtra, setNomeExtra] = useState("");
  const [precoExtra, setPrecoExtra] = useState("");
  const [mensagem, setMensagem] = useState("");

  function setItens(atualizador) {
    atualizarItensLista(lista.id, atualizador);
  }

  function alternarStatus(id) {
    setItens((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: i.status === "carrinho" ? "pendente" : "carrinho" } : i))
    );
  }

  function fecharScanner() {
    setScannerAberto(false);
    setEtapaScanner("scanner");
    setItemSugerido(null);
    setNomeEscaneado("");
    setNomeExtra("");
    setPrecoExtra("");
  }

  // chamado pelo BarcodeScanner quando o produto é identificado
  function aoReceberProdutoEscaneado({ nome: nomeLido, codigo }) {
    setScannerAberto(false);
    const faltaPegarAgora = itens.filter((i) => i.status === "pendente");

    if (!nomeLido) {
      // produto não encontrado na base — abre o extra com o código pré-preenchido
      setNomeExtra(codigo ?? "");
      setEtapaScanner("extra");
      return;
    }

    if (faltaPegarAgora.length === 0) {
      setNomeExtra(nomeLido);
      setEtapaScanner("extra");
      return;
    }

    const correspondencia = encontrarMelhorCorrespondencia(nomeLido, faltaPegarAgora);
    if (correspondencia && correspondencia.score >= LIMIAR_CONFIANTE) {
      alternarStatus(correspondencia.item.id);
    } else if (correspondencia) {
      setNomeEscaneado(nomeLido);
      setItemSugerido(correspondencia.item);
      setEtapaScanner("confirmar");
    } else {
      setNomeExtra(nomeLido);
      setEtapaScanner("extra");
    }
  }

  function confirmarCorrespondencia() {
    if (itemSugerido) alternarStatus(itemSugerido.id);
    fecharScanner();
  }

  function rejeitarCorrespondencia() {
    setNomeExtra(nomeEscaneado);
    setItemSugerido(null);
    setEtapaScanner("extra");
  }

  function adicionarItemExtra() {
    if (!nomeExtra.trim()) return;
    setItens((prev) => [
      ...prev,
      {
        id: Date.now(),
        nome: nomeExtra.trim(),
        quantidade: 1,
        preco: Number(precoExtra) || 0,
        categoria: inferirCategoria(nomeExtra),
        status: "carrinho",
      },
    ]);
    fecharScanner();
  }

  function aoFinalizarCompra() {
    const valorFinalizado = finalizarCompra(lista.id);
    if (!valorFinalizado) return;
    setMensagem(`Compra no ${mercadoAtual} finalizada! R$ ${valorFinalizado.toFixed(2).replace(".", ",")} somados ao gasto do mês — preços salvos para comparação.`);
    setTimeout(() => setMensagem(""), 5000);
  }

  const faltaPegar = itens.filter((i) => i.status === "pendente");
  const noCarrinho = itens.filter((i) => i.status === "carrinho");
  const total = noCarrinho.reduce((s, i) => s + i.preco * i.quantidade, 0);

  return (
    <div className="mx-auto max-w-4xl pb-44 lg:pb-32">
      <button
        onClick={onTrocarLista}
        className="animate-rise mb-3 flex cursor-pointer items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-forest-700"
      >
        <ArrowLeft className="h-4 w-4" /> Trocar de lista
      </button>

      <div className="animate-rise flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full min-w-0 sm:flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Modo mercado</p>
          <h1 className="truncate font-display text-2xl font-semibold text-ink-900 sm:text-[1.9rem]" title={lista.nome}>
            {lista.nome}
          </h1>
        </div>
        {isPremium && (
          <ScanButton size="sm" className="self-start" onClick={() => setScannerAberto(true)}>
            <ScanLine className="h-4 w-4" /> Escanear
          </ScanButton>
        )}
      </div>

      <div className="animate-rise mt-4">
        <MarketSelector
          mercados={mercados}
          mercadoAtual={mercadoAtual}
          onEscolher={setMercadoAtual}
          onAdicionar={adicionarMercado}
        />
      </div>

      {mensagem && (
        <div className="animate-rise mt-4 flex items-center gap-2.5 rounded-xl bg-forest-100 px-4 py-3 text-sm font-medium text-forest-700">
          <PartyPopper className="h-4 w-4 shrink-0" /> {mensagem}
        </div>
      )}

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-ink-500">
            Falta pegar <Badge tone="terracotta">{faltaPegar.length}</Badge>
          </h2>
          <ul className="flex flex-col gap-2.5">
            {faltaPegar.map((item) => (
              <ItemCard key={item.id} item={item} onToggle={() => alternarStatus(item.id)} />
            ))}
            {faltaPegar.length === 0 && (
              <Card className="p-6 text-center text-sm text-ink-400">Tudo no carrinho!</Card>
            )}
          </ul>
        </section>

        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-ink-500">
            Já no carrinho <Badge tone="forest">{noCarrinho.length}</Badge>
          </h2>
          <ul className="flex flex-col gap-2.5">
            {noCarrinho.map((item) => (
              <ItemCard key={item.id} item={item} onToggle={() => alternarStatus(item.id)} marcado />
            ))}
            {noCarrinho.length === 0 && (
              <Card className="p-6 text-center text-sm text-ink-400">Nenhum item ainda — comece marcando!</Card>
            )}
          </ul>
        </section>
      </div>

      {/* Rodapé fixo */}
      <div className="fixed inset-x-0 bottom-16 z-20 border-t border-ink-900/[0.08] bg-paper/95 px-4 py-3.5 backdrop-blur-sm lg:bottom-0 lg:left-64 lg:px-8">
        <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between sm:block">
            <div>
              <p className="text-xs font-semibold text-ink-400">Total no carrinho</p>
              <p className="font-display text-3xl font-semibold text-forest-700 sm:text-4xl">
                {formatBRL(total)}
              </p>
            </div>
            <Badge tone={faltaPegar.length === 0 ? "forest" : "ink"} className="text-sm py-1.5 px-3.5 sm:hidden">
              {faltaPegar.length === 0 ? "Compra completa" : `${faltaPegar.length} restantes`}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <Badge tone={faltaPegar.length === 0 ? "forest" : "ink"} className="hidden text-sm py-1.5 px-3.5 sm:flex">
              {faltaPegar.length === 0 ? "Compra completa" : `${faltaPegar.length} itens restantes`}
            </Badge>
            <Button
              variant="forest"
              className="w-full sm:w-auto"
              disabled={noCarrinho.length === 0}
              onClick={aoFinalizarCompra}
            >
              <Check className="h-4 w-4" /> Finalizar compra
            </Button>
          </div>
        </div>
      </div>

      {/* câmera real de escaneamento — carrega o @zxing só quando necessário */}
      {scannerAberto && (
        <Suspense fallback={null}>
          <BarcodeScanner
            onScan={aoReceberProdutoEscaneado}
            onCancelar={fecharScanner}
          />
        </Suspense>
      )}

      {/* modais pós-escaneamento (confirmar item ou adicionar extra) */}
      {!scannerAberto && etapaScanner !== "scanner" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/60 p-4 backdrop-blur-sm">
          <Card className="relative w-full max-w-sm overflow-hidden p-6 text-center">
            {etapaScanner === "confirmar" && (
              <>
                <p className="font-display text-lg font-semibold text-ink-900">Confere esse item?</p>
                <p className="mt-1 text-sm text-ink-500">
                  O código leu <strong className="text-ink-700">"{nomeEscaneado}"</strong> — o nome não é idêntico ao da sua lista, mas parece ser o mesmo produto:
                </p>
                <div className="mt-3 rounded-xl border border-forest-500/30 bg-forest-100/50 px-4 py-3 text-left">
                  <p className="font-semibold text-ink-900">{itemSugerido?.nome}</p>
                  <p className="text-sm text-ink-500">
                    {itemSugerido?.quantidade}x · R$ {itemSugerido?.preco.toFixed(2).replace(".", ",")}
                  </p>
                </div>
                <div className="mt-5 flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={rejeitarCorrespondencia}>Não é esse</Button>
                  <Button className="flex-1" onClick={confirmarCorrespondencia}>Sim, é esse</Button>
                </div>
              </>
            )}

            {etapaScanner === "extra" && (
              <>
                <p className="font-display text-lg font-semibold text-ink-900">Produto fora da lista</p>
                <p className="mt-1 text-sm text-ink-500">Adicione direto no carrinho — ele entra como item extra na compra.</p>
                <div className="mt-4 flex flex-col gap-3 text-left">
                  <label>
                    <span className="mb-1.5 block text-xs font-semibold text-ink-600">Produto</span>
                    <input
                      autoFocus
                      value={nomeExtra}
                      onChange={(e) => setNomeExtra(e.target.value)}
                      placeholder="Ex.: Chocolate"
                      className="w-full rounded-xl border border-ink-900/10 bg-paper px-3.5 py-2.5 text-sm outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/15"
                    />
                  </label>
                  <label>
                    <span className="mb-1.5 block text-xs font-semibold text-ink-600">Preço</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={precoExtra}
                      onChange={(e) => setPrecoExtra(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && adicionarItemExtra()}
                      placeholder="0,00"
                      className="w-full rounded-xl border border-ink-900/10 bg-paper px-3.5 py-2.5 text-sm outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/15"
                    />
                  </label>
                </div>
                <div className="mt-5 flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => { setScannerAberto(true); setEtapaScanner("scanner"); }}>Escanear outro</Button>
                  <Button className="flex-1" disabled={!nomeExtra.trim()} onClick={adicionarItemExtra}>Adicionar ao carrinho</Button>
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

function MarketSelector({ mercados, mercadoAtual, onEscolher, onAdicionar }) {
  const [aberto, setAberto] = useState(false);
  const [novoMercado, setNovoMercado] = useState("");

  function confirmarNovo() {
    if (!novoMercado.trim()) return;
    onAdicionar(novoMercado);
    setNovoMercado("");
    setAberto(false);
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setAberto((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-ink-900/10 bg-paper px-3.5 py-2.5 text-sm font-medium text-ink-700 shadow-soft-sm cursor-pointer hover:border-forest-500/30"
      >
        <Store className="h-4 w-4 text-forest-700" />
        Comprando em <span className="font-semibold text-forest-700">{mercadoAtual}</span>
        <ChevronDown className="h-3.5 w-3.5 text-ink-400" />
      </button>

      {aberto && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setAberto(false)} />
          <div className="absolute left-0 z-30 mt-2 w-64 overflow-hidden rounded-xl border border-ink-900/10 bg-paper shadow-soft-lg">
            <ul className="max-h-48 overflow-y-auto py-1.5">
              {mercados.map((m) => (
                <li key={m}>
                  <button
                    onClick={() => { onEscolher(m); setAberto(false); }}
                    className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm cursor-pointer hover:bg-ink-900/[0.04] ${
                      m === mercadoAtual ? "font-semibold text-forest-700" : "text-ink-700"
                    }`}
                  >
                    {m}
                    {m === mercadoAtual && <Check className="h-4 w-4" />}
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-1.5 border-t border-ink-900/[0.06] p-2">
              <input
                value={novoMercado}
                onChange={(e) => setNovoMercado(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && confirmarNovo()}
                placeholder="Outro mercado..."
                className="w-full rounded-lg border border-ink-900/10 bg-paper px-2.5 py-1.5 text-sm outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/15"
              />
              <button
                onClick={confirmarNovo}
                aria-label="Adicionar mercado"
                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-forest-700 text-cream-50 hover:bg-forest-800"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ItemCard({ item, onToggle, marcado }) {
  return (
    <li>
      <button
        onClick={onToggle}
        className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left shadow-soft-sm transition-all duration-200 cursor-pointer ${
          marcado ? "border-forest-500/20 bg-forest-100/60" : "border-ink-900/[0.06] bg-paper hover:border-forest-500/30"
        }`}
      >
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200 ${
            marcado ? "border-forest-600 bg-forest-600 text-cream-50" : "border-ink-900/20 text-transparent"
          }`}
        >
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </span>
        <CategoryIcon categoria={item.categoria} size="sm" />
        <div className="flex-1">
          <p className={`text-sm font-medium ${marcado ? "text-ink-500 line-through" : "text-ink-900"}`}>{item.nome}</p>
          <p className="text-xs text-ink-400">{item.quantidade}x</p>
        </div>
        <span className="font-mono text-2xl font-semibold text-ink-800">
          R$ {(item.preco * item.quantidade).toFixed(2).replace(".", ",")}
        </span>
      </button>
    </li>
  );
}
