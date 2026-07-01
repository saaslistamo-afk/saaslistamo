import { useState } from "react";
import { X, Wallet } from "lucide-react";
import Card from "./Card";
import Button from "./Button";

export default function EditBudgetModal({ valorAtual, onSalvar, onFechar }) {
  const [valor, setValor] = useState(String(valorAtual));

  function salvar() {
    const numero = Number(valor.replace(",", "."));
    if (!numero || numero <= 0) return;
    onSalvar(numero);
    onFechar();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/60 p-4 backdrop-blur-sm">
      <Card className="relative w-full max-w-sm p-6">
        <button onClick={onFechar} className="absolute right-4 top-4 cursor-pointer text-ink-400 hover:text-ink-700">
          <X className="h-5 w-5" />
        </button>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-100 text-forest-700">
          <Wallet className="h-5 w-5" />
        </span>
        <h2 className="mt-3 font-display text-lg font-semibold text-ink-900">Orçamento do mês</h2>
        <p className="mt-1 text-sm text-ink-500">Defina um valor-limite. Avisamos quando o gasto se aproximar.</p>

        <label className="mt-4 block">
          <span className="mb-1.5 block text-xs font-semibold text-ink-600">Valor (R$)</span>
          <input
            type="number"
            min="0"
            step="0.01"
            autoFocus
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && salvar()}
            className="w-full rounded-xl border border-ink-900/10 bg-paper px-3.5 py-2.5 text-sm text-ink-900 outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/15"
          />
        </label>

        <Button className="mt-5 w-full" onClick={salvar}>Salvar orçamento</Button>
      </Card>
    </div>
  );
}
