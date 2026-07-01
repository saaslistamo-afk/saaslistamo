import { cn } from "../../utils/cn";

const VARIANTS = {
  primary:
    "bg-terracotta-500 text-cream-50 shadow-soft hover:bg-terracotta-600 active:bg-terracotta-700",
  forest:
    "bg-forest-700 text-cream-50 shadow-soft hover:bg-forest-800 active:bg-forest-950",
  outline:
    "bg-transparent text-ink-800 border border-ink-900/15 hover:bg-ink-900/5",
  ghost: "bg-transparent text-ink-600 hover:bg-ink-900/5",
};

const SIZES = {
  sm: "h-9 px-3.5 text-sm gap-1.5",
  md: "h-11 px-5 text-[0.95rem] gap-2",
  lg: "h-13 px-7 text-base gap-2",
};

export default function Button({
  as: Tag = "button",
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}) {
  return (
    <Tag
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-semibold tracking-tight cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-400 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-100",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
