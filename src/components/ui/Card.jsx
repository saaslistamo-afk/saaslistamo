import { cn } from "../../utils/cn";

export default function Card({ className = "", children, ...props }) {
  return (
    <div
      className={cn("rounded-2xl bg-paper border border-ink-900/[0.06] shadow-soft", className)}
      {...props}
    >
      {children}
    </div>
  );
}
