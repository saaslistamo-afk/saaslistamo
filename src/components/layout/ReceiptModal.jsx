import { X, Receipt } from "lucide-react";
import Card from "../ui/Card";
import CategoryIcon from "../ui/CategoryIcon";

function formatBRL(v) {
  return `R$ ${v.toFixed(2).replace(".", ",")}`;
}

export default function ReceiptModal({ mes, onFechar }) {
  if (!mes) return null;
  const total = mes.produtos.reduce((s, p) => s + p.preco * p.quantidade, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/60 p-4 backdrop-blur-sm" onClick={onFechar}>
      <Card
        className="relative flex w-full max-w-md flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: "85vh" }}
      >
        <div className="flex items-start justify-between border-b border-dashed border-ink-900/15 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-100 text-forest-700">
              <Receipt className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Compras de</p>
              <h2 className="font-display text-xl font-semibold text-ink-900">{mes.mes}</h2>
            </div>
          </div>
          <button onClick={onFechar} className="cursor-pointer rounded-full p-1.5 text-ink-400 hover:bg-ink-900/5 hover:text-ink-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <ul className="flex flex-col gap-3.5">
            {mes.produtos.map((p, i) => (
              <li key={i} className="flex items-baseline gap-2">
                <CategoryIcon categoria={p.categoria} size="sm" />
                <span className="shrink-0 text-sm font-medium text-ink-800">
                  {p.nome} <span className="text-ink-400">{p.quantidade}x</span>
                </span>
                <span className="-translate-y-1 flex-1 border-b border-dotted border-ink-300" />
                <span className="shrink-0 font-mono text-sm text-ink-700">
                  {formatBRL(p.preco * p.quantidade)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-dashed border-ink-900/15 px-6 py-5">
          <div className="flex items-center justify-between">
            <span className="font-display text-lg font-semibold text-ink-900">Total</span>
            <span className="font-mono text-2xl font-semibold text-forest-700">{formatBRL(total)}</span>
          </div>
          <p className="mt-1 text-xs text-ink-400">{mes.itens} itens comprados no mês</p>
        </div>
      </Card>
    </div>
  );
}
