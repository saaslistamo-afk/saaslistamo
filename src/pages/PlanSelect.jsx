import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Crown, Medal, ShoppingBasket, Sparkles, RefreshCw, Mail, ExternalLink } from "lucide-react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import BoasVindasPremium from "../components/ui/BoasVindasPremium";
import { PLANOS } from "../mock/data";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";

const ESTILO_PREMIUM = {
  barra: "from-ouro-300 via-ouro-600 to-ouro-300",
  borda: "border-ouro-500/50",
  icone: "bg-ouro-100 text-ouro-700",
};

export default function PlanSelect() {
  const { plano: planoAtual, usuario } = useApp();
  const { carregandoPlano, recarregarPlano } = useAuth();
  const navigate = useNavigate();
  const [mostrarBoasVindas, setMostrarBoasVindas] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [jaVerificou, setJaVerificou] = useState(false);
  const trialAindaAtivo = planoAtual === "trial" && usuario.trialDiasRestantes > 0;

  // Botão de saída pra quem já pagou mas a tela não atualizou sozinha (ex.:
  // aba ficou aberta desde antes do pagamento, ou o webhook da Cakto ainda
  // não processou) — sem isso, a única opção era fechar e reabrir o app às
  // cegas, sem saber se ia resolver.
  async function verificarNovamente() {
    setVerificando(true);
    await recarregarPlano();
    setVerificando(false);
    setJaVerificou(true);
  }

  function assinar() {
    // Pré-preenche e trava o e-mail no checkout com o da conta logada — sem
    // isso, a pessoa pode pagar com um e-mail diferente do da conta (ex.: o
    // e-mail salvo no cartão) e o webhook nunca encontra essa conta pra
    // liberar o Premium. Parâmetros documentados pela Cakto para checkout
    // pré-preenchido: https://ajuda.cakto.com.br/pt/article/como-usar-url-para-checkout-pre-preenchido-j3kwax/
    const params = new URLSearchParams({ email: usuario.email, confirmEmail: usuario.email });
    if (usuario.nome) params.set("name", usuario.nome);
    window.location.href = `https://pay.cakto.com.br/ngkivkg_953027?${params.toString()}`;
  }

  // Essa é a única tela que fica visível pra quem não é premium (RotaPrivada
  // não redireciona daqui), então é a única que também precisa esperar
  // carregandoPlano por conta própria — senão mostra "assine agora" por um
  // instante pra quem já é premium, antes do plano real chegar.
  if (carregandoPlano) {
    return (
      <div className="flex min-h-[calc(100vh-2rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-900/10 border-t-forest-600" />
      </div>
    );
  }

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

        <div className="mt-8 w-full rounded-2xl border border-ink-900/[0.06] bg-cream-100 p-5 text-left">
          <p className="text-sm font-semibold text-ink-800">Quer cancelar ou trocar a forma de pagamento?</p>
          <p className="mt-1.5 text-sm text-ink-600">
            Sua assinatura é gerenciada pela Cakto, nosso parceiro de pagamentos. Acesse com o mesmo e-mail
            usado na compra ({usuario.email}) — não precisa de senha, é só pedir o link de acesso.
          </p>
          <a
            href="https://sso.cakto.com.br/accounts/login/?next=https%3A%2F%2Fapp.cakto.com.br%2Fdashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-terracotta-600 hover:text-terracotta-700"
          >
            Gerenciar assinatura na Cakto <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
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

          <Button variant="primary" size="lg" className="mt-7 w-full" onClick={assinar}>
            Assinar Premium <Crown className="h-4 w-4" />
          </Button>
        </Card>
      </div>

      <p className="animate-rise mt-8 text-center text-xs text-ink-400" style={{ animationDelay: "160ms" }}>
        Pagamento processado com segurança via Cakto · Pix, cartão ou boleto
      </p>

      <div className="animate-rise mt-5 flex flex-col items-center gap-2" style={{ animationDelay: "200ms" }}>
        <button
          type="button"
          disabled={verificando}
          onClick={verificarNovamente}
          className="flex cursor-pointer items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-forest-700 disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${verificando ? "animate-spin" : ""}`} />
          {verificando ? "Verificando..." : "Já assinei — verificar novamente"}
        </button>

        {jaVerificou && (
          <p className="max-w-xs text-center text-xs text-ink-500">
            Ainda não encontramos sua assinatura. Se você já pagou, pode levar alguns minutos —
            tente de novo em instantes ou fale com a gente:{" "}
            <a href="mailto:saaslistamo@gmail.com" className="inline-flex items-center gap-1 font-semibold text-terracotta-600 hover:text-terracotta-700">
              <Mail className="h-3 w-3" /> saaslistamo@gmail.com
            </a>
          </p>
        )}
      </div>

      {mostrarBoasVindas && (
        <BoasVindasPremium onFechar={() => { setMostrarBoasVindas(false); navigate("/dashboard"); }} />
      )}
    </div>
  );
}
