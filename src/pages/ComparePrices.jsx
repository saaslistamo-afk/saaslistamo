import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Scale, Trophy, Medal, Search, ShoppingCart } from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import CategoryIcon from "../components/ui/CategoryIcon";
import { useApp } from "../context/AppContext";
import { diasAtras } from "../mock/data";
import { agruparHistoricoPorProduto, resumoPorMercado } from "../utils/precos";
import { inferirCategoria } from "../utils/categorizar";
import { cn } from "../utils/cn";

export default function ComparePrices() {
  const { isPremium, historicoPrecos } = useApp();
  const navigate = useNavigate();
  const [busca, setBusca] = useState("");

  const grupos = useMemo(() => agruparHistoricoPorProduto(historicoPrecos), [historicoPrecos]);
  const resumo = useMemo(() => resumoPorMercado(historicoPrecos), [historicoPrecos]);
  const ranking = resumo.slice(0, 4);

  const grupoFiltrados = busca.trim()
    ? grupos.filter((g) => g.produto.toLowerCase().includes(busca.trim().toLowerCase()))
    : grupos;

  if (!isPremium) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center pt-20 text-center">
        <Scale className="h-10 w-10 text-ink-300" />
        <h1 className="mt-4 font-display text-2xl font-semibold text-ink-900">Comparar Preços é exclusivo do Premium</h1>
        <p className="mt-2 text-ink-600">Veja em qual mercado cada produto sai mais barato, com base no seu histórico de compras.</p>
      </div>
    );
  }

  if (grupos.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center pt-20 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-terracotta-100 text-terracotta-600">
          <Scale className="h-7 w-7" />
        </span>
        <h1 className="animate-rise mt-5 font-display text-2xl font-semibold text-ink-900">Ainda não há dados pra comparar</h1>
        <p className="animate-rise mt-2 text-ink-600" style={{ animationDelay: "40ms" }}>
          Faça compras para o sistema começar a trabalhar em qual mercado você vai economizar mais. No Modo Mercado, não esqueça de selecionar onde você está comprando antes de finalizar — é assim que cada preço fica registrado no mercado certo.
        </p>
        <Button className="animate-rise mt-5" style={{ animationDelay: "80ms" }} onClick={() => navigate("/modo-mercado")}>
          <ShoppingCart className="h-4 w-4" /> Ir para o Modo Mercado
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="animate-rise flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-terracotta-100 text-terracotta-600">
          <Scale className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Inteligência de preços</p>
          <h1 className="font-display text-[2rem] font-semibold tracking-tight text-ink-900 sm:text-[2.2rem]">Comparar Preços</h1>
        </div>
      </div>

      {ranking.length > 0 && (
        <div className="mt-5 flex flex-col gap-3">
          <RankTile
            rank={0}
            mercado={ranking[0].mercado}
            vezes={ranking[0].vezesMaisBarato}
            total={grupos.length}
            delay={60}
          />
          {ranking.length > 1 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {ranking.slice(1).map((r, i) => (
                <RankTile
                  key={r.mercado}
                  rank={i + 1}
                  mercado={r.mercado}
                  vezes={r.vezesMaisBarato}
                  total={grupos.length}
                  delay={110 + i * 50}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <label className="animate-rise mt-5 block" style={{ animationDelay: "260ms" }}>
        <span className="relative flex items-center">
          <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-ink-400" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar um produto..."
            className="w-full rounded-xl border border-ink-900/10 bg-paper py-2.5 pl-10 pr-3.5 text-sm text-ink-900 shadow-soft-sm outline-none placeholder:text-ink-400 focus:border-forest-500 focus:ring-2 focus:ring-forest-500/15"
          />
        </span>
      </label>

      <div className="mt-5 flex flex-col gap-3">
        {grupoFiltrados.map((grupo, i) => (
          <Card key={grupo.produto} className="animate-rise p-4" style={{ animationDelay: `${300 + i * 40}ms` }}>
            <div className="flex items-center gap-2.5">
              <CategoryIcon categoria={inferirCategoria(grupo.produto)} size="sm" />
              <p className="font-semibold text-ink-900">{grupo.produto}</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {grupo.porMercado.map((registro, idx) => {
                const melhor = idx === 0 && grupo.porMercado.length > 1;
                return (
                  <div
                    key={registro.mercado}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-3.5 py-2.5",
                      melhor
                        ? "bg-gradient-to-br from-forest-600 to-forest-800 shadow-soft"
                        : "border border-ink-900/[0.06] bg-cream-100"
                    )}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={cn("font-mono font-bold tabular-nums", melhor ? "text-lg text-cream-50" : "text-sm text-ink-800")}>
                          R$ {registro.preco.toFixed(2).replace(".", ",")}
                        </p>
                        {melhor && (
                          <span className="rounded-full bg-cream-50/20 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-cream-50">
                            mais barato
                          </span>
                        )}
                      </div>
                      <p className={cn("text-xs", melhor ? "text-forest-100/85" : "text-ink-500")}>
                        {registro.mercado} · {diasAtras(registro.data)} dia(s) atrás
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            {grupo.porMercado.length === 1 && (
              <p className="mt-2 text-xs text-ink-400">Comprado só nesse mercado até agora — finalize compras em outros pra comparar.</p>
            )}
          </Card>
        ))}

        {grupoFiltrados.length === 0 && (
          <p className="py-10 text-center text-sm text-ink-400">Nenhum produto encontrado.</p>
        )}
      </div>
    </div>
  );
}

function RankTile({ rank, mercado, vezes, total, delay }) {
  const destaque = rank === 0;
  return (
    <div
      className={cn(
        "animate-rise relative overflow-hidden rounded-2xl p-4",
        destaque
          ? "bg-gradient-to-br from-forest-600 to-forest-900 text-cream-50 shadow-lift"
          : "border border-ink-900/[0.06] bg-paper shadow-soft-sm"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <span
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full",
          destaque ? "bg-cream-50/15" : "bg-terracotta-100 text-terracotta-600"
        )}
      >
        {destaque ? <Trophy className="h-4 w-4" /> : <Medal className="h-4 w-4" />}
      </span>
      <p className={cn("mt-3 font-display font-semibold tabular-nums", destaque ? "text-4xl" : "text-2xl text-ink-900")}>
        {vezes}
        <span className={cn("ml-1 font-sans text-sm font-medium", destaque ? "text-forest-100/70" : "text-ink-400")}>
          /{total}
        </span>
      </p>
      <p className={cn("mt-1 truncate text-sm font-semibold", destaque ? "text-cream-50" : "text-ink-700")}>{mercado}</p>
      <p className={cn("text-xs", destaque ? "text-forest-100/70" : "text-ink-400")}>produtos mais baratos</p>
    </div>
  );
}
