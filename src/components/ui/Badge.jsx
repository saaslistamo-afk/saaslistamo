import { cn } from "../../utils/cn";

const TONES = {
  forest: "bg-forest-100 text-forest-700 border-forest-200",
  amber: "bg-amber-100 text-amber-600 border-amber-500/20",
  rose: "bg-rose-100 text-rose-600 border-rose-500/20",
  terracotta: "bg-terracotta-100 text-terracotta-700 border-terracotta-500/20",
  ink: "bg-ink-900/[0.05] text-ink-600 border-ink-900/10",
};

export default function Badge({ tone = "ink", className = "", children, dot = false }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold tracking-tight", TONES[tone], className)}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
