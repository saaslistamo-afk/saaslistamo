import { useState } from "react";
import { X, Clock } from "lucide-react";
import Card from "./Card";
import Button from "./Button";
import { useTravarScroll } from "../../hooks/useTravarScroll";

export default function ConfigurarHorarioModal({ valorAtual, onSalvar, onFechar }) {
  const [horario, setHorario] = useState(valorAtual);
  useTravarScroll(true);

  function salvar() {
    if (!horario) return;
    onSalvar(horario);
    onFechar();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/60 p-4 backdrop-blur-sm">
      <Card className="relative w-full max-w-sm p-6">
        <button onClick={onFechar} aria-label="Fechar" className="absolute right-4 top-4 cursor-pointer text-ink-400 hover:text-ink-700">
          <X className="h-5 w-5" />
        </button>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-100 text-forest-700">
          <Clock className="h-5 w-5" />
        </span>
        <h2 className="mt-3 font-display text-lg font-semibold text-ink-900">Horário do alerta</h2>
        <p className="mt-1 text-sm text-ink-500">Escolha a hora do dia em que você quer receber o aviso de itens vencendo.</p>

        <label className="mt-4 block">
          <span className="mb-1.5 block text-xs font-semibold text-ink-600">Horário</span>
          <input
            type="time"
            autoFocus
            value={horario}
            onChange={(e) => setHorario(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && salvar()}
            className="w-full rounded-xl border border-ink-900/10 bg-paper px-3.5 py-2.5 text-sm text-ink-900 outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/15"
          />
        </label>

        <Button className="mt-5 w-full" onClick={salvar}>Salvar</Button>
      </Card>
    </div>
  );
}
