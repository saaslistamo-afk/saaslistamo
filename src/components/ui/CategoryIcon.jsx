import {
  Carrot, Milk, Beef, Croissant, SprayCan, Sparkles, CupSoda, ShoppingBasket, Snowflake,
} from "lucide-react";
import { CATEGORIAS } from "../../mock/data";

const ICONS = { Carrot, Milk, Beef, Croissant, SprayCan, Sparkles, CupSoda, ShoppingBasket, Snowflake };

const TONE_BG = {
  forest: "bg-forest-100 text-forest-700",
  amber: "bg-amber-100 text-amber-600",
  terracotta: "bg-terracotta-100 text-terracotta-700",
};

export default function CategoryIcon({ categoria, size = "md" }) {
  const info = CATEGORIAS[categoria] ?? { icon: "ShoppingBasket", cor: "ink", label: categoria };
  const Icon = ICONS[info.icon] ?? ShoppingBasket;
  const dim = size === "sm" ? "h-7 w-7" : size === "lg" ? "h-12 w-12" : "h-9 w-9";
  const iconDim = size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-6 w-6" : "h-4.5 w-4.5";

  return (
    <span className={`inline-flex items-center justify-center rounded-full ${dim} ${TONE_BG[info.cor] ?? "bg-ink-900/5 text-ink-600"}`}>
      <Icon className={iconDim} strokeWidth={2} />
    </span>
  );
}
