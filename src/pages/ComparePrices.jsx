import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Scale, Trophy, Search, ShoppingCart } from "lucide-react";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import CategoryIcon from "../components/ui/CategoryIcon";
import { useApp } from "../context/AppContext";
import { diasAtras } from "../mock/data";
import { agruparHistoricoPorProduto, resumoPorMercado } from "../utils/precos";
import { inferirCategoria } from "../utils/categorizar";

export default function ComparePrices() {
  const { isPremium, historicoPrecos } = useApp();
  const navigate = useNavigate();
  const [busca, setBusca] = useState("");

  const grupos = useMemo(() => agruparHistoricoPorProduto(historicoPrecos), [historicoPrecos]);
  const resumo = useMemo(() => resumoPorMercado(historicoPrecos), [historicoPrecos]);
  const mercadoDestaque = resumo[0];

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
          <h1 className="font-display text-[1.7rem] font-semibold text-ink-900 sm:text-[1.9rem]">Comparar Preços</h1>
        </div>
      </div>

      {mercadoDestaque && (
        <Card className="animate-rise mt-5 flex items-center gap-4 bg-forest-800 p-5 text-cream-50" style={{ animationDelay: "60ms" }}>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cream-50/15">
            <Trophy className="h-5 w-5" />
          </span>
          <div>
            <p className="font-display text-lg font-semibold">{mercadoDestaque.mercado} tem sido seu mercado mais econômico</p>
            <p className="mt-0.5 text-sm text-forest-200/90">
              Mais barato em {mercadoDestaque.vezesMaisBarato} de {grupos.length} produtos comparados
            </p>
          </div>
        </Card>
      )}

      <label className="animate-rise mt-5 block" style={{ animationDelay: "100ms" }}>
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
          <Card key={grupo.produto} className="animate-rise p-4" style={{ animationDelay: `${140 + i * 40}ms` }}>
            <div className="flex items-center gap-2.5">
              <CategoryIcon categoria={inferirCategoria(grupo.produto)} size="sm" />
              <p className="font-semibold text-ink-900">{grupo.produto}</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {grupo.porMercado.map((registro, idx) => (
                <div
                  key={registro.mercado}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${
                    idx === 0 && grupo.porMercado.length > 1
                      ? "border-forest-500/40 bg-forest-100"
                      : "border-ink-900/[0.06] bg-cream-100"
                  }`}
                >
                  <div>
                    <p className={`font-mono text-sm font-semibold ${idx === 0 && grupo.porMercado.length > 1 ? "text-forest-700" : "text-ink-800"}`}>
                      R$ {registro.preco.toFixed(2).replace(".", ",")}
                    </p>
                    <p className="text-xs text-ink-500">
                      {registro.mercado} · {diasAtras(registro.data)} dia(s) atrás
                    </p>
                  </div>
                  {idx === 0 && grupo.porMercado.length > 1 && <Badge tone="forest">mais barato</Badge>}
                </div>
              ))}
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
