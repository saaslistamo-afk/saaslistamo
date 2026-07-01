import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ListPlus, ShoppingCart, ScanLine, Archive, TrendingDown, TrendingUp,
  AlertTriangle, CircleAlert, ArrowRight,
} from "lucide-react";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import ScanButton from "../components/ui/ScanButton";
import BudgetJar from "../components/ui/BudgetJar";
import CategoryIcon from "../components/ui/CategoryIcon";
import EditBudgetModal from "../components/ui/EditBudgetModal";
import { useApp } from "../context/AppContext";
import { HISTORICO, CATEGORIAS, statusValidade, diasParaVencer } from "../mock/data";
import { gastoPorCategoria, itensEsquecidos } from "../utils/precos";
import scanBg from "../assets/scan-bg.png";

const _hoje = new Date();
const MES_ATUAL_PREFIXO = _hoje.toISOString().slice(0, 7);
const DATA_FORMATADA = _hoje.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })
  .replace(/^./, (c) => c.toUpperCase());

function formatBRL(v) {
  return `R$ ${v.toFixed(2).replace(".", ",")}`;
}

export default function Dashboard() {
  const { usuario, isPremium, orcamento, setOrcamento, listas, gastoMes, despensa, historicoPrecos } = useApp();
  const navigate = useNavigate();
  const [editandoOrcamento, setEditandoOrcamento] = useState(false);

  const listaAtiva = listas[0];
  const itensLista = listaAtiva?.itens ?? [];
  const noCarrinho = itensLista.filter((i) => i.status === "carrinho").length;
  const mesAnterior = HISTORICO[0];
  const variacao = mesAnterior ? ((gastoMes - mesAnterior.total) / mesAnterior.total) * 100 : null;

  const despensaCritica = despensa
    .map((d) => ({ ...d, status: statusValidade(d.dataValidade), dias: diasParaVencer(d.dataValidade) }))
    .filter((d) => d.status !== "valido")
    .sort((a, b) => a.dias - b.dias);

  const gastoCategorias = gastoPorCategoria(historicoPrecos, MES_ATUAL_PREFIXO);
  const itensEsquecidosReais = itensEsquecidos(historicoPrecos, _hoje.toISOString().slice(0, 10));

  return (
    <div className="mx-auto max-w-5xl">
      <div className="animate-rise flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-ink-400">{DATA_FORMATADA}</p>
          <h1 className="font-display text-[1.9rem] font-semibold text-ink-900">Olá, {usuario.nome.split(" ")[0]}</h1>
        </div>
        <div className="hidden gap-2 sm:flex">
          <Button variant="outline" size="sm" onClick={() => navigate("/nova-lista")}>
            <ListPlus className="h-4 w-4" /> Nova lista
          </Button>
          {isPremium && (
            <ScanButton size="sm" onClick={() => navigate("/modo-mercado")}>
              <ScanLine className="h-4 w-4" /> Escanear produto
            </ScanButton>
          )}
        </div>
      </div>

      {/* Ações rápidas mobile */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:hidden">
        <QuickAction icon={ListPlus} label="Nova lista" onClick={() => navigate("/nova-lista")} />
        <QuickAction icon={ShoppingCart} label="Modo mercado" onClick={() => navigate("/modo-mercado")} />
        {isPremium && <QuickAction icon={Archive} label="Ver despensa" onClick={() => navigate("/despensa")} />}
        {isPremium && <QuickAction icon={ScanLine} label="Escanear" onClick={() => navigate("/modo-mercado")} imagemFundo={scanBg} />}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        {/* Orçamento */}
        <Card className="animate-rise p-6 lg:order-last" style={{ animationDelay: "60ms" }}>
          <BudgetJar gasto={gastoMes} orcamento={orcamento} size={104} onEditar={() => setEditandoOrcamento(true)} />
          {mesAnterior && (
            <div className="mt-5 flex items-center gap-2 rounded-lg bg-cream-100 px-3 py-2 text-xs font-medium text-ink-600">
              {variacao <= 0 ? <TrendingDown className="h-4 w-4 text-forest-600" /> : <TrendingUp className="h-4 w-4 text-terracotta-600" />}
              {Math.abs(variacao).toFixed(0)}% {variacao <= 0 ? "menor" : "maior"} que {mesAnterior.mes}
            </div>
          )}
        </Card>

        {/* Lista ativa */}
        <Card className="animate-rise p-6 lg:col-span-2 lg:order-first" style={{ animationDelay: "120ms" }}>
          {listaAtiva ? (
            <>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Lista mais recente</p>
                  <h2 className="truncate font-display text-xl font-semibold text-ink-900" title={listaAtiva.nome}>
                    {listaAtiva.nome}
                  </h2>
                </div>
                <Badge tone="forest" className="shrink-0 self-start sm:self-auto">{noCarrinho} de {itensLista.length} no carrinho</Badge>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {Object.keys(CATEGORIAS).slice(0, 6).map((cat) => {
                  const count = itensLista.filter((i) => i.categoria === cat).length;
                  if (!count) return null;
                  return (
                    <span key={cat} className="flex items-center gap-1.5 rounded-full bg-cream-100 px-2.5 py-1 text-xs font-medium text-ink-600">
                      <CategoryIcon categoria={cat} size="sm" /> {CATEGORIAS[cat].label} · {count}
                    </span>
                  );
                })}
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button onClick={() => navigate("/nova-lista")}>Ver suas listas</Button>
                <Button variant="outline" className="whitespace-nowrap" onClick={() => navigate("/modo-mercado")}>
                  Ir para o modo mercado <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-start">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Nenhuma lista ainda</p>
              <p className="mt-1 text-ink-600">Comece uma lista de compras pra ver o resumo aqui.</p>
              <Button className="mt-4" onClick={() => navigate("/nova-lista")}>
                <ListPlus className="h-4 w-4" /> Começar lista
              </Button>
            </div>
          )}
        </Card>
      </div>

      {isPremium && (
        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          <Card className="animate-rise p-6 lg:col-span-2" style={{ animationDelay: "180ms" }}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-ink-900">Resumo diário da despensa</h3>
              <Badge tone="rose" dot>{despensaCritica.length} para atenção</Badge>
            </div>
            <ul className="mt-4 divide-y divide-ink-900/[0.06]">
              {despensaCritica.slice(0, 4).map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="flex items-center gap-2.5 text-sm font-medium text-ink-800">
                    <CategoryIcon categoria={item.categoria} size="sm" />
                    {item.nomeProduto}
                  </span>
                  <Badge tone={item.status === "vencido" ? "rose" : "amber"}>
                    {item.status === "vencido" ? `Venceu há ${Math.abs(item.dias)} dia(s)` : `Vence em ${item.dias} dia(s)`}
                  </Badge>
                </li>
              ))}
            </ul>
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => navigate("/despensa")}>
              Ver despensa completa <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Card>

          <Card className="animate-rise p-6" style={{ animationDelay: "220ms" }}>
            <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
              <AlertTriangle className="h-4 w-4 text-amber-600" /> Itens esquecidos
            </h3>
            {itensEsquecidosReais.length === 0 ? (
              <p className="mt-3 text-sm text-ink-500">
                Continue fazendo compras — assim que notarmos um padrão, avisamos aqui o que você costuma esquecer.
              </p>
            ) : (
              <ul className="mt-3 flex flex-col gap-3.5">
                {itensEsquecidosReais.map((item) => (
                  <li key={item.nome} className="flex items-center justify-between gap-3">
                    <span className="flex items-start gap-2.5">
                      <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-terracotta-500" />
                      <span>
                        <p className="text-sm font-semibold text-ink-900">{item.nome}</p>
                        <p className="text-xs text-ink-400">costuma comprar a cada {item.intervaloMedio} dia(s)</p>
                      </span>
                    </span>
                    <Badge tone="amber" className="shrink-0 whitespace-nowrap">{item.diasSemComprar}d sem comprar</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      {isPremium && (
        <Card className="animate-rise mt-5 p-6" style={{ animationDelay: "260ms" }}>
          <h3 className="font-display text-lg font-semibold text-ink-900">Gasto por categoria este mês</h3>
          {gastoCategorias.length === 0 ? (
            <p className="mt-3 text-sm text-ink-500">Finalize compras pra ver aqui como o gasto se divide entre as categorias.</p>
          ) : (
            <div className="mt-4 flex flex-col gap-2.5">
              {gastoCategorias.map((g) => {
                const max = gastoCategorias[0].valor;
                const pct = (g.valor / max) * 100;
                return (
                  <div key={g.categoria} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 text-xs font-medium text-ink-600">{CATEGORIAS[g.categoria]?.label ?? g.categoria}</span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-cream-200">
                      <div className="h-full rounded-full bg-forest-600" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-16 shrink-0 text-right font-mono text-xs text-ink-700">{formatBRL(g.valor)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {!isPremium && (
        <Card className="animate-rise mt-5 flex items-center justify-between gap-4 p-6" style={{ animationDelay: "180ms" }}>
          <p className="font-semibold text-ink-900">Assine o Premium para desbloquear todas as funcionalidades.</p>
          <Button size="sm" onClick={() => navigate("/planos")}>Ver plano</Button>
        </Card>
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

function QuickAction({ icon: Icon, label, onClick, locked, imagemFundo }) {
  if (imagemFundo) {
    return (
      <button
        onClick={onClick}
        className="relative isolate flex items-center gap-2.5 overflow-hidden rounded-xl px-3.5 py-3 text-sm font-semibold text-cream-50 shadow-soft-sm cursor-pointer transition-transform duration-200 active:scale-[0.98]"
        style={{ backgroundImage: `url(${imagemFundo})`, backgroundSize: "cover", backgroundPosition: "center" }}
      >
        <span className="absolute inset-0 bg-gradient-to-r from-forest-950/90 via-forest-900/70 to-forest-900/35" />
        <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-cream-50/15 text-cream-50">
          <Icon className="h-4 w-4" />
        </span>
        <span className="relative z-10">{label}</span>
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-xl border border-ink-900/[0.06] bg-paper px-3.5 py-3 text-sm font-semibold text-ink-800 shadow-soft-sm cursor-pointer hover:border-forest-500/30"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest-100 text-forest-700">
        <Icon className="h-4 w-4" />
      </span>
      {label}
    </button>
  );
}
