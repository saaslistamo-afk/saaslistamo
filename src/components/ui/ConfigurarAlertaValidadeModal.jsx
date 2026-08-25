import { useState } from "react";
import { X, Clock } from "lucide-react";
import Card from "./Card";
import Button from "./Button";
import { cn } from "../../utils/cn";
import { useTravarScroll } from "../../hooks/useTravarScroll";

const DIAS_SEMANA = [
  { valor: 0, rotulo: "Dom" }, { valor: 1, rotulo: "Seg" }, { valor: 2, rotulo: "Ter" },
  { valor: 3, rotulo: "Qua" }, { valor: 4, rotulo: "Qui" }, { valor: 5, rotulo: "Sex" },
  { valor: 6, rotulo: "Sáb" },
];

const DIAS_MES = Array.from({ length: 28 }, (_, i) => i + 1);

// Opções de antecedência — cada uma vira uma chave "unidade-valor" no estado
// (ex.: "semanas-1") pra evitar ambiguidade: 7 dias só pode vir de
// "semanas-1", nunca de "dias-7", já que "Dias" só vai até 6.
const OPCOES_ANTECEDENCIA = [
  { unidade: "dias", rotulo: "Dias", valores: [1, 2, 3, 4, 5, 6] },
  { unidade: "semanas", rotulo: "Semanas", valores: [1, 2, 3] },
  { unidade: "meses", rotulo: "Mês", valores: [1] },
];

function chaveParaDias(chave) {
  const [unidade, valorStr] = chave.split("-");
  const valor = Number(valorStr);
  if (unidade === "semanas") return valor * 7;
  if (unidade === "meses") return valor * 30;
  return valor;
}

function diasParaChave(dias) {
  if (dias === 30) return "meses-1";
  if (dias % 7 === 0 && dias <= 21) return `semanas-${dias / 7}`;
  return `dias-${dias}`;
}

const FREQUENCIAS = [
  { valor: "unica", rotulo: "1x por dia" },
  { valor: "diaria", rotulo: "2x por dia" },
  { valor: "semanal", rotulo: "2x por semana" },
  { valor: "mensal", rotulo: "2x por mês" },
];

// Preenche 2 alertas com valores razoáveis ao trocar de frequência, pra
// nunca deixar a usuária num estado "2x por semana" sem dia nenhum escolhido.
function alertasPadrao(frequencia, alertasAtuais) {
  if (frequencia === "diaria") {
    return [0, 1].map((i) => ({ horario: alertasAtuais[i]?.horario ?? (i === 0 ? "08:00" : "20:00") }));
  }
  if (frequencia === "semanal") {
    return [0, 1].map((i) => ({
      diaSemana: alertasAtuais[i]?.diaSemana ?? (i === 0 ? 1 : 4),
      horario: alertasAtuais[i]?.horario ?? "08:00",
    }));
  }
  if (frequencia === "mensal") {
    return [0, 1].map((i) => ({
      diaMes: alertasAtuais[i]?.diaMes ?? (i === 0 ? 1 : 15),
      horario: alertasAtuais[i]?.horario ?? "08:00",
    }));
  }
  return [];
}

export default function ConfigurarAlertaValidadeModal({ valorAtual, onSalvar, onFechar }) {
  const [frequencia, setFrequencia] = useState(valorAtual.frequencia ?? "unica");
  const [horarioUnico, setHorarioUnico] = useState(valorAtual.horario ?? "08:00");
  const [alertas, setAlertas] = useState(
    valorAtual.alertas?.length ? valorAtual.alertas : alertasPadrao(valorAtual.frequencia ?? "unica", [])
  );
  const [antecedencia, setAntecedencia] = useState(
    () => new Set((valorAtual.antecedenciaDias?.length ? valorAtual.antecedenciaDias : [3]).map(diasParaChave))
  );
  useTravarScroll(true);

  function trocarFrequencia(nova) {
    setFrequencia(nova);
    setAlertas(alertasPadrao(nova, alertas));
  }

  function atualizarAlerta(indice, campo, valor) {
    setAlertas((prev) => prev.map((a, i) => (i === indice ? { ...a, [campo]: valor } : a)));
  }

  // Nunca deixa ficar sem nenhuma opção marcada — sem antecedência nenhuma,
  // a notificação de validade nunca dispararia (só o item já vencido conta).
  function alternarAntecedencia(chave) {
    setAntecedencia((prev) => {
      const novo = new Set(prev);
      if (novo.has(chave)) {
        if (novo.size === 1) return prev;
        novo.delete(chave);
      } else {
        novo.add(chave);
      }
      return novo;
    });
  }

  function salvar() {
    const antecedenciaDias = Array.from(antecedencia).map(chaveParaDias).sort((a, b) => a - b);
    if (frequencia === "unica") {
      if (!horarioUnico) return;
      onSalvar({ frequencia, horario: horarioUnico, alertas: [], antecedenciaDias });
    } else {
      if (alertas.some((a) => !a.horario)) return;
      onSalvar({ frequencia, alertas, antecedenciaDias });
    }
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
        <h2 className="mt-3 font-display text-lg font-semibold text-ink-900">Alerta de item vencendo</h2>
        <p className="mt-1 text-sm text-ink-500">Escolha com que frequência avisar sobre itens vencidos ou vencendo na despensa.</p>

        <div className="mt-4">
          <span className="mb-1.5 block text-xs font-semibold text-ink-600">Avisar com quanto tempo de antecedência</span>
          <p className="mb-2 text-[0.7rem] text-ink-400">Pode escolher mais de uma opção — cada uma vira um aviso separado.</p>
          <div className="flex flex-col gap-2.5">
            {OPCOES_ANTECEDENCIA.map((grupo) => (
              <div key={grupo.unidade}>
                <span className="mb-1 block text-[0.7rem] font-medium text-ink-400">{grupo.rotulo}</span>
                <div className="flex flex-wrap gap-1.5">
                  {grupo.valores.map((v) => {
                    const chave = `${grupo.unidade}-${v}`;
                    const marcado = antecedencia.has(chave);
                    return (
                      <button
                        key={chave}
                        type="button"
                        onClick={() => alternarAntecedencia(chave)}
                        className={cn(
                          "h-8 min-w-8 cursor-pointer rounded-lg px-2 text-xs font-semibold transition-colors",
                          marcado
                            ? "bg-forest-700 text-cream-50"
                            : "bg-ink-900/5 text-ink-600 hover:bg-ink-900/10"
                        )}
                      >
                        {v}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <span className="mt-5 mb-1.5 block text-xs font-semibold text-ink-600">Com que frequência verificar</span>
        <div className="grid grid-cols-2 gap-2">
          {FREQUENCIAS.map((f) => (
            <button
              key={f.valor}
              onClick={() => trocarFrequencia(f.valor)}
              className={cn(
                "cursor-pointer rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                frequencia === f.valor
                  ? "border-forest-600 bg-forest-100 text-forest-800"
                  : "border-ink-900/10 bg-paper text-ink-600 hover:bg-ink-900/5"
              )}
            >
              {f.rotulo}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {frequencia === "unica" && (
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-ink-600">Horário</span>
              <input
                type="time"
                autoFocus
                value={horarioUnico}
                onChange={(e) => setHorarioUnico(e.target.value)}
                className="w-full rounded-xl border border-ink-900/10 bg-paper px-3.5 py-2.5 text-sm text-ink-900 outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/15"
              />
            </label>
          )}

          {frequencia === "diaria" && alertas.map((alerta, i) => (
            <label key={i} className="block">
              <span className="mb-1.5 block text-xs font-semibold text-ink-600">Horário do {i + 1}º alerta</span>
              <input
                type="time"
                value={alerta.horario}
                onChange={(e) => atualizarAlerta(i, "horario", e.target.value)}
                className="w-full rounded-xl border border-ink-900/10 bg-paper px-3.5 py-2.5 text-sm text-ink-900 outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/15"
              />
            </label>
          ))}

          {frequencia === "semanal" && alertas.map((alerta, i) => (
            <div key={i} className="rounded-xl border border-ink-900/10 p-3">
              <span className="mb-1.5 block text-xs font-semibold text-ink-600">{i + 1}º alerta</span>
              <div className="flex flex-wrap gap-1.5">
                {DIAS_SEMANA.map((d) => (
                  <button
                    key={d.valor}
                    onClick={() => atualizarAlerta(i, "diaSemana", d.valor)}
                    className={cn(
                      "h-8 w-10 cursor-pointer rounded-lg text-xs font-semibold transition-colors",
                      alerta.diaSemana === d.valor
                        ? "bg-forest-700 text-cream-50"
                        : "bg-ink-900/5 text-ink-600 hover:bg-ink-900/10"
                    )}
                  >
                    {d.rotulo}
                  </button>
                ))}
              </div>
              <input
                type="time"
                value={alerta.horario}
                onChange={(e) => atualizarAlerta(i, "horario", e.target.value)}
                className="mt-2.5 w-full rounded-xl border border-ink-900/10 bg-paper px-3.5 py-2.5 text-sm text-ink-900 outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/15"
              />
            </div>
          ))}

          {frequencia === "mensal" && alertas.map((alerta, i) => (
            <div key={i} className="rounded-xl border border-ink-900/10 p-3">
              <span className="mb-1.5 block text-xs font-semibold text-ink-600">{i + 1}º alerta</span>
              <select
                value={alerta.diaMes}
                onChange={(e) => atualizarAlerta(i, "diaMes", Number(e.target.value))}
                className="w-full rounded-xl border border-ink-900/10 bg-paper px-3.5 py-2.5 text-sm text-ink-900 outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/15"
              >
                {DIAS_MES.map((d) => (
                  <option key={d} value={d}>Dia {d}</option>
                ))}
              </select>
              <input
                type="time"
                value={alerta.horario}
                onChange={(e) => atualizarAlerta(i, "horario", e.target.value)}
                className="mt-2.5 w-full rounded-xl border border-ink-900/10 bg-paper px-3.5 py-2.5 text-sm text-ink-900 outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/15"
              />
            </div>
          ))}
        </div>

        <Button className="mt-5 w-full" onClick={salvar}>Salvar</Button>
      </Card>
    </div>
  );
}
