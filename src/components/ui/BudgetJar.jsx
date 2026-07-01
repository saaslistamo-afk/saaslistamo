import { Pencil } from "lucide-react";

const BODY_Y = 6;
const BODY_H = 126;

function corPorPercentual(pct) {
  if (pct >= 0.95) return { fill: "var(--color-rose-500)", text: "text-rose-600", tone: "rose" };
  if (pct >= 0.75) return { fill: "var(--color-amber-500)", text: "text-amber-600", tone: "amber" };
  return { fill: "var(--color-forest-600)", text: "text-forest-700", tone: "forest" };
}

export default function BudgetJar({ gasto, orcamento, size = 128, onEditar, valorClassName = "text-3xl", empilhado = false, label = "Gasto do mês" }) {
  const pctRaw = orcamento > 0 ? gasto / orcamento : 0;
  const pct = Math.min(pctRaw, 1);
  const { fill, text } = corPorPercentual(pctRaw);
  const fillHeight = BODY_H * pct;
  const fillY = BODY_Y + (BODY_H - fillHeight);
  const restante = orcamento - gasto;

  return (
    <div className={empilhado ? "flex flex-col items-start gap-4" : "flex items-center gap-5"}>
      <svg width={size} height={size * 1.09} viewBox="0 0 96 140" className="shrink-0 drop-shadow-[0_6px_10px_rgba(38,28,18,0.12)]">
        <defs>
          <clipPath id="jar-body-clip">
            <rect x="6" y={BODY_Y} width="84" height={BODY_H} rx="18" />
          </clipPath>
        </defs>

        {/* corpo (contorno) */}
        <rect x="6" y={BODY_Y} width="84" height={BODY_H} rx="18" fill="var(--color-cream-50)" stroke="var(--color-ink-900)" strokeOpacity="0.1" strokeWidth="1.5" />

        {/* liquido */}
        <g clipPath="url(#jar-body-clip)">
          <rect
            x="6"
            y={fillY}
            width="84"
            height={fillHeight + 6}
            fill={fill}
            style={{ transition: "y 0.7s cubic-bezier(0.16,1,0.3,1), height 0.7s cubic-bezier(0.16,1,0.3,1)" }}
          />
          <rect
            x="6"
            y={fillY}
            width="84"
            height="4"
            fill="white"
            opacity="0.35"
            style={{ transition: "y 0.7s cubic-bezier(0.16,1,0.3,1)" }}
          />
        </g>

        {/* brilho do vidro */}
        <rect x="14" y={BODY_Y + 6} width="7" height={BODY_H - 16} rx="3.5" fill="white" opacity="0.25" />
      </svg>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</p>
        <p className={`font-bebas tracking-wide ${valorClassName} ${text}`}>
          R$ {gasto.toFixed(2).replace(".", ",")}
        </p>
        <div className="flex items-center gap-1.5">
          <p className="text-sm text-ink-600">
            de R$ {orcamento.toFixed(2).replace(".", ",")} ·{" "}
            <span className={restante < 0 ? "text-rose-600 font-semibold" : "text-forest-700 font-semibold"}>
              {restante < 0
                ? `R$ ${Math.abs(restante).toFixed(2).replace(".", ",")} acima`
                : `R$ ${restante.toFixed(2).replace(".", ",")} livres`}
            </span>
          </p>
          {onEditar && (
            <button
              onClick={onEditar}
              aria-label="Editar orçamento do mês"
              className="cursor-pointer rounded-full p-1 text-ink-400 hover:bg-ink-900/5 hover:text-forest-700"
            >
              <Pencil className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
