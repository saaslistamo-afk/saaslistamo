import { useMemo, useState } from "react";
import { TrendingDown, TrendingUp, History as HistoryIcon, ChevronRight } from "lucide-react";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import ReceiptModal from "../components/layout/ReceiptModal";
import { useApp } from "../context/AppContext";
import { HISTORICO, HOJE_MOCK } from "../mock/data";
import { inferirCategoria } from "../utils/categorizar";
import { useNavigate } from "react-router-dom";

const MES_ATUAL_PREFIXO = HOJE_MOCK.slice(0, 7);
const MES_ATUAL_LABEL = "Junho 2026";

export default function History() {
  const { historicoPrecos, gastoMes, orcamento } = useApp();
  const navigate = useNavigate();
  const [mesSelecionado, setMesSelecionado] = useState(null);

  // entrada real do mês atual — derivada do que foi realmente comprado via Modo Mercado
  const mesAtual = useMemo(() => {
    const doMes = historicoPrecos.filter((r) => r.data.startsWith(MES_ATUAL_PREFIXO));
    if (doMes.length === 0) return null;
    return {
      mes: MES_ATUAL_LABEL,
      total: gastoMes,
      orcamento,
      itens: doMes.reduce((s, r) => s + (r.quantidade ?? 1), 0),
      produtos: doMes.map((r) => ({
        nome: r.produto,
        quantidade: r.quantidade ?? 1,
        preco: r.preco,
        categoria: inferirCategoria(r.produto),
      })),
    };
  }, [historicoPrecos, gastoMes, orcamento]);

  // meses passados estáticos (demo seed) + mês atual em tempo real no topo
  const todoHistorico = mesAtual ? [mesAtual, ...HISTORICO] : HISTORICO;
  const visiveis = todoHistorico;
  const maiorGasto = todoHistorico.length > 0 ? Math.max(...todoHistorico.map((h) => h.total)) : 0;

  if (todoHistorico.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center pt-20 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-forest-100 text-forest-700">
          <HistoryIcon className="h-7 w-7" />
        </span>
        <h1 className="animate-rise mt-5 font-display text-2xl font-semibold text-ink-900">Você ainda não tem histórico de compras</h1>
        <p className="animate-rise mt-2 text-ink-600" style={{ animationDelay: "40ms" }}>
          Finalize compras no modo mercado para começar a acompanhar seus gastos mês a mês.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="animate-rise">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Histórico</p>
        <h1 className="font-display text-[1.9rem] font-semibold text-ink-900">Seus meses de compra</h1>
        <p className="mt-1.5 text-sm text-ink-500">Clique em um mês para ver todos os produtos comprados.</p>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {visiveis.map((mes, i) => {
          const dentroOrcamento = mes.total <= mes.orcamento;
          const pctBarra = maiorGasto > 0 ? (mes.total / maiorGasto) * 100 : 0;
          const ehMesAtual = mes.mes === MES_ATUAL_LABEL && mesAtual !== null;
          return (
            <Card
              key={mes.mes}
              role="button"
              tabIndex={0}
              onClick={() => setMesSelecionado(mes)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setMesSelecionado(mes)}
              className="animate-rise cursor-pointer p-5 transition-shadow duration-200 hover:shadow-soft-lg"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2.5">
                    <p className="font-display text-lg font-semibold text-ink-900">{mes.mes}</p>
                    {ehMesAtual && (
                      <Badge tone="forest" dot>em andamento</Badge>
                    )}
                    {!ehMesAtual && (
                      <Badge tone={dentroOrcamento ? "forest" : "rose"}>
                        {dentroOrcamento ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                        {dentroOrcamento ? "dentro do orçamento" : "acima do orçamento"}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-ink-500">{mes.itens} itens comprados</p>
                  <div className="mt-3 h-2 w-full max-w-xs overflow-hidden rounded-full bg-cream-200">
                    <div
                      className={`h-full rounded-full ${ehMesAtual ? "bg-forest-400" : dentroOrcamento ? "bg-forest-600" : "bg-rose-500"}`}
                      style={{ width: `${pctBarra}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-xl font-semibold text-ink-900">
                    R$ {mes.total.toFixed(2).replace(".", ",")}
                  </p>
                  <ChevronRight className="h-4 w-4 text-ink-300" />
                </div>
              </div>
            </Card>
          );
        })}

      </div>

      {mesSelecionado && <ReceiptModal mes={mesSelecionado} onFechar={() => setMesSelecionado(null)} />}
    </div>
  );
}
