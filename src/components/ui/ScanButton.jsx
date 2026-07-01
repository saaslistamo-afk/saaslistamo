import scanBg from "../../assets/scan-bg.png";
import { cn } from "../../utils/cn";

const SIZES = {
  sm: "h-9 px-3.5 text-sm gap-1.5",
  md: "h-11 px-5 text-[0.95rem] gap-2",
};

export default function ScanButton({ size = "md", className = "", children, ...props }) {
  return (
    <button
      className={cn(
        "relative isolate inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl font-semibold tracking-tight text-cream-50 shadow-soft cursor-pointer transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-400 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-100",
        SIZES[size],
        className
      )}
      style={{ backgroundImage: `url(${scanBg})`, backgroundSize: "cover", backgroundPosition: "center" }}
      {...props}
    >
      <span className="absolute inset-0 bg-gradient-to-r from-forest-950/90 via-forest-900/75 to-forest-900/35" />
      <span className="relative z-10 inline-flex items-center gap-1.5 whitespace-nowrap">{children}</span>
    </button>
  );
}
