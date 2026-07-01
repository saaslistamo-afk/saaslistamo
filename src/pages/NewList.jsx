import { useState, useRef, useEffect } from "react";
import {
  Plus, Trash2, ScanLine, FileDown, Sparkle, X, ShoppingBasket, Pencil, Check, Scale, Tag,
  ChevronRight, ListPlus, ArrowLeft,
} from "lucide-react";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import BudgetJar from "../components/ui/BudgetJar";
import CategoryIcon from "../components/ui/CategoryIcon";
import EditBudgetModal from "../components/ui/EditBudgetModal";
import { useApp } from "../context/AppContext";
import BarcodeScanner from "../components/ui/BarcodeScanner";
import { CATEGORIAS } from "../mock/data";
import { inferirCategoria, quantidadeSugerida, restricaoConflitante } from "../utils/categorizar";
import { ultimoPrecoPorMercado, produtosRecorrentes, ehRecorrente } from "../utils/precos";

function formatBRL(v) {
  return `R$ ${v.toFixed(2).replace(".", ",")}`;
}

export default function NewList() {
  const { listas, criarLista, atualizarItensLista, renomearLista, excluirLista } = useApp();
  const [listaSelecionadaId, setListaSelecionadaId] = useState(null);
  const [idRecemCriada, setIdRecemCriada] = useState(null);

  const listaAtiva = listas.find((l) => l.id === listaSelecionadaId);

  function aoComecarNovaLista() {
    const nova = criarLista();
    setListaSelecionadaId(nova.id);
    setIdRecemCriada(nova.id);
  }

  function aoExcluirLista(id) {
    excluirLista(id);
    if (id === listaSelecionadaId) setListaSelecionadaId(null);
  }

  if (!listaAtiva) {
    return (
      <SeletorDeListas
        listas={listas}
        onComecarNova={aoComecarNovaLista}
        onAbrirLista={(id) => setListaSelecionadaId(id)}
        onExcluirLista={aoExcluirLista}
      />
    );
  }

  return (
    <EditorDeLista
      lista={listaAtiva}
      onItensChange={(atualizador) => atualizarItensLista(listaAtiva.id, atualizador)}
      onRenomear={(novoNome) => renomearLista(listaAtiva.id, novoNome)}
      onTrocarLista={() => setListaSelecionadaId(null)}
      onExcluirLista={() => aoExcluirLista(listaAtiva.id)}
      comecarRenomeando={listaAtiva.id === idRecemCriada}
    />
  );
}

function SeletorDeListas({ listas, onComecarNova, onAbrirLista, onExcluirLista }) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="animate-rise">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Nova lista</p>
        <h1 className="font-display text-[1.9rem] font-semibold text-ink-900">Monte sua lista de compras</h1>
      </div>

      <button
        onClick={onComecarNova}
        className="animate-rise mt-6 flex w-full cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed border-forest-500/40 bg-forest-100/40 p-5 text-left transition-colors duration-150 hover:bg-forest-100/70"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-forest-700 text-cream-50 shadow-soft">
          <ListPlus className="h-6 w-6" />
        </span>
        <div>
          <p className="font-display text-lg font-semibold text-ink-900">Começar nova lista</p>
          <p className="text-sm text-ink-600">Crie uma lista em branco e dê um nome pra ela</p>
        </div>
      </button>

      {listas.length > 0 && (
        <div className="mt-8">
          <p className="animate-rise mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">
            Suas listas salvas
          </p>
          <div className="flex flex-col gap-3">
            {listas.map((lista, i) => {
              const total = lista.itens.reduce((s, it) => s + it.preco * it.quantidade, 0);
              return (
                <Card
                  key={lista.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onAbrirLista(lista.id)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onAbrirLista(lista.id)}
                  className="animate-rise flex cursor-pointer items-center justify-between gap-3 p-4 transition-shadow duration-150 hover:shadow-soft-lg"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{lista.mes}</p>
                    <p className="truncate font-display text-lg font-semibold text-ink-900">{lista.nome}</p>
                    <p className="text-sm text-ink-500">{lista.itens.length} itens · {formatBRL(total)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <BotaoExcluirLista nome={lista.nome} onConfirmar={() => onExcluirLista(lista.id)} />
                    <ChevronRight className="h-5 w-5 text-ink-300" />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function BotaoExcluirLista({ nome, onConfirmar }) {
  const [confirmando, setConfirmando] = useState(false);

  if (confirmando) {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); onConfirmar(); }}
        onMouseLeave={() => setConfirmando(false)}
        aria-label={`Confirmar exclusão de ${nome}`}
        className="flex shrink-0 items-center gap-1 rounded-full bg-rose-500 px-2.5 py-1.5 text-xs font-semibold text-cream-50 cursor-pointer"
      >
        <Trash2 className="h-3.5 w-3.5" /> Confirmar?
      </button>
    );
  }
  return (
    <button
      onClick={(e) => { e.stopPropagation(); setConfirmando(true); }}
      aria-label={`Excluir ${nome}`}
      className="shrink-0 cursor-pointer rounded-full p-2 text-ink-300 hover:bg-rose-100/60 hover:text-rose-600"
    >
      <Trash2 className="h-5 w-5" />
    </button>
  );
}

function EditorDeLista({ lista, onItensChange, onRenomear, onTrocarLista, onExcluirLista, comecarRenomeando = false }) {
  const { isPremium, orcamento, setOrcamento, historicoPrecos, faixasIdade, restricoesAlimentares } = useApp();
  const itens = lista.itens;
  const [nome, setNome] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [quantidadeTocada, setQuantidadeTocada] = useState(false);
  const [preco, setPreco] = useState("");
  const [scannerAberto, setScannerAberto] = useState(false);
  const [editandoOrcamento, setEditandoOrcamento] = useState(false);
  const [editandoNome, setEditandoNome] = useState(comecarRenomeando);
  const [rascunhoNome, setRascunhoNome] = useState(comecarRenomeando ? "" : lista.nome);
  const [mensagem, setMensagem] = useState("");
  const inputPrecoRef = useRef(null);

  function salvarNomeLista() {
    const valor = rascunhoNome.trim();
    if (valor) onRenomear(valor);
    else setRascunhoNome(lista.nome);
    setEditandoNome(false);
  }

  // auto-preenche quantidade sugerida conforme o nome digitado e o tamanho da casa
  useEffect(() => {
    if (quantidadeTocada || !isPremium) return;
    if (nome.length < 3) { setQuantidade(1); return; }
    setQuantidade(quantidadeSugerida(nome, faixasIdade.length));
  }, [nome, isPremium, quantidadeTocada, faixasIdade.length]);

  const total = itens.reduce((s, i) => s + i.preco * i.quantidade, 0);

  const conflito = nome.trim().length >= 2
    ? restricaoConflitante(nome, restricoesAlimentares)
    : null;
  const comparacaoPreco = ultimoPrecoPorMercado(nome, historicoPrecos);
  const sugestoesRecorrentes = produtosRecorrentes(historicoPrecos, itens);

  function adicionarItem(nomeProduto, precoProduto = 0) {
    if (!nomeProduto.trim()) return;
    const categoria = inferirCategoria(nomeProduto);
    onItensChange((prev) => [
      ...prev,
      { id: Date.now(), nome: nomeProduto, quantidade: Number(quantidade) || 1, preco: Number(precoProduto) || 0, categoria, status: "pendente" },
    ]);
    setNome("");
    setPreco("");
    setQuantidade(1);
    setQuantidadeTocada(false);
  }

  function adicionarSugestaoRecorrente(nomeProduto) {
    const melhorPreco = ultimoPrecoPorMercado(nomeProduto, historicoPrecos)[0];
    adicionarItem(nomeProduto, melhorPreco?.preco ?? 0);
  }

  function removerItem(id) {
    onItensChange((prev) => prev.filter((i) => i.id !== id));
  }

  function aoReceberProdutoEscaneado({ nome: nomeProduto }) {
    setScannerAberto(false);
    if (nomeProduto) {
      setNome(nomeProduto);
      setTimeout(() => inputPrecoRef.current?.focus(), 50);
    }
  }

  function exportarPDF() {
    setMensagem("PDF gerado — pronto para compartilhar no WhatsApp.");
    setTimeout(() => setMensagem(""), 3000);
  }

  const agrupados = Object.entries(
    itens.reduce((acc, item) => {
      (acc[item.categoria] ??= []).push(item);
      return acc;
    }, {})
  );

  return (
    <div className="mx-auto max-w-4xl">
      <div className="animate-rise mb-3 flex items-center justify-between">
        <button
          onClick={onTrocarLista}
          className="flex cursor-pointer items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-forest-700"
        >
          <ArrowLeft className="h-4 w-4" /> Trocar de lista
        </button>
        <BotaoExcluirLista nome={lista.nome} onConfirmar={onExcluirLista} />
      </div>

      <div className="animate-rise flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full min-w-0 sm:flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{lista.mes}</p>
          {editandoNome ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={rascunhoNome}
                onChange={(e) => setRascunhoNome(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") salvarNomeLista();
                  if (e.key === "Escape") { setRascunhoNome(lista.nome); setEditandoNome(false); }
                }}
                onBlur={salvarNomeLista}
                maxLength={40}
                placeholder="Nome da lista"
                className="w-full max-w-sm border-b-2 border-forest-500 bg-transparent font-display text-[1.9rem] font-semibold text-ink-900 outline-none"
              />
              <button onClick={salvarNomeLista} aria-label="Salvar nome da lista" className="cursor-pointer rounded-full p-1.5 text-forest-700 hover:bg-forest-100">
                <Check className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="min-w-0 truncate font-display text-2xl font-semibold text-ink-900 sm:text-[1.9rem]" title={lista.nome}>
                {lista.nome}
              </h1>
              <button
                onClick={() => { setRascunhoNome(lista.nome); setEditandoNome(true); }}
                aria-label="Renomear lista"
                className="shrink-0 cursor-pointer rounded-full p-1.5 text-ink-300 hover:bg-ink-900/5 hover:text-forest-700"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 self-start">
          {isPremium && (
            <Button variant="outline" size="sm" onClick={exportarPDF}>
              <FileDown className="h-4 w-4" /> Exportar PDF
            </Button>
          )}
        </div>
      </div>

      {mensagem && (
        <div className="animate-rise mt-3 rounded-lg bg-forest-100 px-4 py-2.5 text-sm font-medium text-forest-700">
          {mensagem}
        </div>
      )}

      {/* Resumo (mobile) */}
      <ResumoLista
        total={total}
        orcamento={orcamento}
        onEditarOrcamento={() => setEditandoOrcamento(true)}
        totalItens={itens.length}
        className="animate-rise mt-4 lg:hidden"
      />

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_280px]">
        <div className="flex flex-col gap-5">
          {/* Formulário de adição */}
          <Card className="animate-rise p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="flex-1">
                <span className="mb-1.5 block text-xs font-semibold text-ink-600">Produto</span>
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && adicionarItem(nome, preco)}
                  placeholder="Ex.: Arroz tipo 1"
                  className="w-full rounded-xl border border-ink-900/10 bg-paper px-3.5 py-2.5 text-sm text-ink-900 shadow-soft-sm outline-none placeholder:text-ink-400 focus:border-forest-500 focus:ring-2 focus:ring-forest-500/15"
                />
              </label>
              <label className="w-full sm:w-20">
                <span className="mb-1.5 block text-xs font-semibold text-ink-600">Qtd.</span>
                <input
                  type="number"
                  min="1"
                  value={quantidade}
                  onChange={(e) => { setQuantidade(e.target.value); setQuantidadeTocada(true); }}
                  className="w-full rounded-xl border border-ink-900/10 bg-paper px-3 py-2.5 text-sm text-ink-900 shadow-soft-sm outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/15"
                />
              </label>
              <label className="w-full sm:w-28">
                <span className="mb-1.5 block text-xs font-semibold text-ink-600">Preço</span>
                <input
                  ref={inputPrecoRef}
                  type="number"
                  min="0"
                  step="0.01"
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && adicionarItem(nome, preco)}
                  placeholder="0,00"
                  className="w-full rounded-xl border border-ink-900/10 bg-paper px-3 py-2.5 text-sm text-ink-900 shadow-soft-sm outline-none placeholder:text-ink-400 focus:border-forest-500 focus:ring-2 focus:ring-forest-500/15"
                />
              </label>
              <div className="flex gap-2">
                {isPremium && (
                  <Button variant="outline" size="md" onClick={() => setScannerAberto(true)} aria-label="Escanear código de barras">
                    <ScanLine className="h-4 w-4" />
                  </Button>
                )}
                <Button onClick={() => adicionarItem(nome, preco)}>
                  <Plus className="h-4 w-4" /> Adicionar
                </Button>
              </div>
            </div>
            {comparacaoPreco.length > 0 && (
              <div className="animate-rise mt-3 rounded-lg bg-cream-100 px-3.5 py-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-600">
                  <Scale className="h-3.5 w-3.5 text-terracotta-500" />
                  {comparacaoPreco.length > 1 ? "Compare entre mercados — clique pra usar o preço" : "Último preço registrado — clique pra usar"}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {comparacaoPreco.map((registro, i) => (
                    <button
                      key={registro.mercado}
                      type="button"
                      onClick={() => setPreco(String(registro.preco))}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors duration-150 ${
                        i === 0 && comparacaoPreco.length > 1
                          ? "border-forest-500/40 bg-forest-100 text-forest-700"
                          : "border-ink-900/10 bg-paper text-ink-600 hover:border-forest-500/30"
                      }`}
                    >
                      {i === 0 && comparacaoPreco.length > 1 && <Tag className="h-3 w-3" />}
                      R$ {registro.preco.toFixed(2).replace(".", ",")}
                      <span className="text-ink-400">· {registro.mercado}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {conflito && (
              <div className="animate-rise mt-3 flex items-center gap-2 rounded-lg bg-amber-100 px-3.5 py-2.5 text-xs font-medium text-ink-700">
                <span className="text-amber-600">⚠</span>
                <span>Sua casa tem restrição registrada para <strong className="font-semibold text-ink-900">{conflito}</strong> — esse produto pode conflitar.</span>
              </div>
            )}
          </Card>

          {/* Sugestões recorrentes — baseadas na frequência real de compra */}
          {sugestoesRecorrentes.length > 0 && (
            <div className="animate-rise flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-500">
                <Sparkle className="h-3.5 w-3.5 text-terracotta-500" /> Você sempre compra:
              </span>
              {sugestoesRecorrentes.map((s) => (
                <button
                  key={s.produto}
                  onClick={() => adicionarSugestaoRecorrente(s.produto)}
                  className="flex cursor-pointer items-center gap-1 rounded-full border border-terracotta-500/30 bg-terracotta-100 px-3 py-1 text-xs font-medium text-terracotta-700 hover:bg-terracotta-100/70"
                >
                  + {s.produto} <span className="text-terracotta-700/60">· {s.vezes}x</span>
                </button>
              ))}
            </div>
          )}

          {/* Lista de itens */}
          <div className="flex flex-col gap-4">
            {agrupados.map(([categoria, listaItens]) => (
              <Card key={categoria} className="animate-rise overflow-hidden">
                <div className="flex items-center gap-2.5 border-b border-ink-900/[0.06] bg-cream-100 px-5 py-2.5">
                  <CategoryIcon categoria={categoria} size="sm" />
                  <span className="text-sm font-semibold text-ink-800">{CATEGORIAS[categoria]?.label ?? categoria}</span>
                  <span className="text-xs text-ink-400">· {listaItens.length}</span>
                </div>
                <ul className="divide-y divide-ink-900/[0.06]">
                  {listaItens.map((item) => (
                    <li key={item.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-ink-900">{item.nome}</p>
                        <p className="text-sm text-ink-400">{item.quantidade}x · R$ {item.preco.toFixed(2).replace(".", ",")}</p>
                      </div>
                      {ehRecorrente(item.nome, historicoPrecos) && <Badge tone="forest" className="hidden sm:flex">recorrente</Badge>}
                      <span className="font-mono text-2xl font-semibold text-ink-800">
                        R$ {(item.preco * item.quantidade).toFixed(2).replace(".", ",")}
                      </span>
                      <button onClick={() => removerItem(item.id)} className="cursor-pointer text-ink-300 hover:text-rose-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                  {listaItens.length === 0 && (
                    <li className="px-5 py-6 text-center text-sm text-ink-400">Nenhum item ainda.</li>
                  )}
                </ul>
              </Card>
            ))}
          </div>
        </div>

        {/* Resumo (desktop) */}
        <ResumoLista
          total={total}
          orcamento={orcamento}
          onEditarOrcamento={() => setEditandoOrcamento(true)}
          totalItens={itens.length}
          className="sticky top-6 hidden h-fit lg:block"
        />
      </div>

      {scannerAberto && (
        <BarcodeScanner
          onScan={aoReceberProdutoEscaneado}
          onCancelar={() => setScannerAberto(false)}
        />
      )}

      {editandoOrcamento && (
        <EditBudgetModal
          valorAtual={orcamento}
          onSalvar={setOrcamento}
          onFechar={() => setEditandoOrcamento(false)}
        />
      )}
    </div>
  );
}

function ResumoLista({ total, orcamento, onEditarOrcamento, totalItens, className = "" }) {
  return (
    <Card className={`p-5 ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Resumo</p>
      <div className="mt-3">
        <BudgetJar gasto={total} orcamento={orcamento} size={72} onEditar={onEditarOrcamento} valorClassName="text-4xl" empilhado label="Total da lista" />
      </div>
      <div className="mt-4 flex items-center justify-between text-sm text-ink-600">
        <span>Itens</span>
        <span className="font-semibold text-ink-900">{totalItens}</span>
      </div>
    </Card>
  );
}
