import { X, ShoppingCart, BarChart2, Archive, Scale } from "lucide-react";
import Button from "./Button";

const PASSOS = [
  {
    icon: ShoppingCart,
    titulo: "Monte sua lista de compras",
    descricao: "Vá em Nova lista, crie uma lista e adicione os produtos que você costuma comprar.",
  },
  {
    icon: ShoppingCart,
    titulo: "Use o Modo Mercado",
    descricao: "Na hora das compras, abra o Modo Mercado, escolha o mercado onde está e finalize a compra. Isso alimenta toda a inteligência do app.",
  },
  {
    icon: Scale,
    titulo: "Compare preços entre mercados",
    descricao: "Após finalizar compras em mercados diferentes, o Comparar Preços mostra onde cada produto sai mais barato.",
  },
  {
    icon: Archive,
    titulo: "Cadastre sua despensa",
    descricao: "Adicione os produtos que você tem em casa com a data de validade para receber alertas antes de vencerem.",
  },
  {
    icon: BarChart2,
    titulo: "Acompanhe seu histórico",
    descricao: "Cada compra finalizada aparece no Histórico com o total gasto e os produtos comprados mês a mês.",
  },
];

export default function BoasVindasPremium({ onFechar }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/60 p-4 backdrop-blur-sm">
      <div className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-paper shadow-lift">
        <button
          onClick={onFechar}
          className="absolute right-4 top-4 cursor-pointer rounded-full p-1.5 text-ink-400 hover:bg-ink-900/5 hover:text-ink-700"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="bg-forest-700 px-6 py-8 text-center text-cream-50">
          <p className="text-xs font-semibold uppercase tracking-widest text-forest-200/80">Bem-vindo ao Premium</p>
          <h2 className="mt-2 font-display text-2xl font-semibold">Por onde começar?</h2>
          <p className="mt-1.5 text-sm text-forest-200/90">
            Siga esses passos para o app trabalhar de verdade pra você.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <ol className="flex flex-col gap-4">
            {PASSOS.map((passo, i) => {
              const Icon = passo.icon;
              return (
                <li key={i} className="flex items-start gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-forest-100 text-forest-700 font-bold text-sm">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-ink-900">{passo.titulo}</p>
                    <p className="mt-0.5 text-sm text-ink-500">{passo.descricao}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="border-t border-ink-900/[0.06] px-6 py-4">
          <Button className="w-full" onClick={onFechar}>
            Entendi, vamos começar!
          </Button>
        </div>
      </div>
    </div>
  );
}
