import { useNavigate } from "react-router-dom";
import { Check, Crown, Medal, ShoppingBasket, Sparkles } from "lucide-react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { PLANOS } from "../mock/data";
import { useApp } from "../context/AppContext";

const ESTILO_PREMIUM = {
  barra: "from-ouro-300 via-ouro-600 to-ouro-300",
  borda: "border-ouro-500/50",
  icone: "bg-ouro-100 text-ouro-700",
};

export default function PlanSelect() {
  const { plano: planoAtual, setPlano, usuario } = useApp();
  const navigate = useNavigate();
  const trialAindaAtivo = planoAtual === "trial" && usuario.trialDiasRestantes > 0;

  if (planoAtual === "premium") {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-md flex-col items-center justify-center py-10 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-forest-700 text-cream-50 shadow-soft">
          <Crown className="h-7 w-7" />
        </span>
        <h1 className="mt-5 font-display text-3xl font-semibold text-ink-900">Você já assina o Premium</h1>
        <p className="mt-3 text-ink-600">
          Você tem acesso completo a todas as funcionalidades do Listamo.
        </p>
        <Button className="mt-6" onClick={() => navigate("/dashboard")}>Voltar ao Dashboard</Button>
      </div>
    );
  }

  const plano = PLANOS[0]; // único plano

  return (
    <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-lg flex-col items-center justify-center py-10">
      <div className="animate-rise mb-10 text-center">
        {trialAindaAtivo ? (
          <>
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-700 text-cream-50 shadow-soft">
              <Sparkles className="h-6 w-6" />
            </span>
            <h1 className="mt-5 font-display text-3xl font-semibold text-ink-900 sm:text-4xl">
              Você ainda tem {usuario.trialDiasRestantes} {usuario.trialDiasRestantes === 1 ? "dia" : "dias"} de teste grátis
            </h1>
            <p className="mx-auto mt-3 max-w-md text-ink-600">
              Aproveite pra conhecer tudo sem compromisso. Quando estiver pronto, assine pra continuar sem interrupção.
            </p>
          </>
        ) : (
          <>
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-700 text-cream-50 shadow-soft">
              <ShoppingBasket className="h-6 w-6" />
            </span>
            <h1 className="mt-5 font-display text-3xl font-semibold text-ink-900 sm:text-4xl">
              Seu teste gratuito terminou
            </h1>
            <p className="mx-auto mt-3 max-w-md text-ink-600">
              Assine o Premium para continuar organizando as compras da casa — pode cancelar quando quiser.
            </p>
          </>
        )}
      </div>

      <div className="animate-rise w-full" style={{ animationDelay: "80ms" }}>
        <Card className={`relative flex flex-col overflow-hidden border-2 p-6 ${ESTILO_PREMIUM.borda}`}>
          <span className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${ESTILO_PREMIUM.barra}`} />
          <span className="efeito-brilho" />

          <span className={`flex h-9 w-9 items-center justify-center rounded-full ${ESTILO_PREMIUM.icone}`}>
            <Medal className="h-4.5 w-4.5" />
          </span>
          <h2 className="mt-3 font-display text-xl font-semibold text-ink-900">{plano.nome}</h2>
          <p className="mt-1 text-sm text-ink-500">{plano.tagline}</p>
          <p className="mt-4 font-display text-5xl font-semibold text-ink-900">
            R$ {plano.preco.toFixed(2).replace(".", ",")}
            <span className="text-base font-medium text-ink-400"> /mês</span>
          </p>

          <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2.5">
            {plano.beneficios.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm text-ink-700">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-forest-600" strokeWidth={2.5} />
                {b}
              </li>
            ))}
          </ul>

          <Button variant="primary" size="lg" className="mt-7 w-full" onClick={() => setPlano("premium")}>
            Assinar Premium <Crown className="h-4 w-4" />
          </Button>
        </Card>
      </div>

      <p className="animate-rise mt-8 text-center text-xs text-ink-400" style={{ animationDelay: "160ms" }}>
        Pagamento processado com segurança via Cakto · Pix, cartão ou boleto
      </p>
    </div>
  );
}
