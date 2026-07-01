import { useEffect, useRef } from "react";
import {
  ListChecks, ShoppingCart, Archive, Scale, Check, ArrowRight,
  Crown, Medal, TrendingDown, ScanLine, Clock,
} from "lucide-react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import logoName from "../assets/logo-listamo-nav.png";
import telaDashboard from "../assets/carrossel/tela-1.jpeg";
import telaNovaLista from "../assets/carrossel/tela-2.jpeg";
import telaModoMercado from "../assets/carrossel/tela-3.jpeg";
import telaComparar from "../assets/carrossel/tela-4.jpeg";
import telaDespensa from "../assets/carrossel/tela-5.jpeg";
import telaHistorico from "../assets/carrossel/tela-6.jpeg";
import telaPerfil from "../assets/carrossel/tela-7.jpeg";

const LINK_ASSINAR = "https://listamo.com.br/assinar";

const TELAS_APP = [
  { src: telaDashboard, alt: "Dashboard do Listamo com resumo do mês e atalhos" },
  { src: telaNovaLista, alt: "Tela de criação de lista de compras" },
  { src: telaModoMercado, alt: "Tela de seleção de lista pro Modo Mercado" },
  { src: telaComparar, alt: "Tela de comparação de preços entre mercados" },
  { src: telaDespensa, alt: "Tela de controle da despensa com alertas de validade" },
  { src: telaHistorico, alt: "Tela de histórico de gastos por mês" },
  { src: telaPerfil, alt: "Tela de perfil da casa com moradores e restrições" },
];

const FEATURES = [
  {
    icon: ListChecks,
    titulo: "Lista de compras inteligente",
    descricao: "Adicione itens rápido, organize por categoria e nunca esqueça nada no mercado.",
    destaque: true,
  },
  {
    icon: ShoppingCart,
    titulo: "Modo Mercado",
    descricao: "Marque os itens em tempo real enquanto compra, sem perder o fio da meada no corredor.",
  },
  {
    icon: Archive,
    titulo: "Controle de despensa",
    descricao: "Cadastre o que já tem em casa e receba um aviso antes de vencer.",
  },
  {
    icon: Scale,
    titulo: "Histórico e comparação de preços",
    descricao: "Veja quanto gastou por mês e onde cada produto sai mais barato.",
  },
  {
    icon: ScanLine,
    titulo: "Scanner de código de barras",
    descricao: "Aponte a câmera pro produto e adicione na lista sem digitar nada.",
  },
];

const PASSOS = [
  {
    titulo: "Crie sua lista",
    descricao: "Monte a lista de compras da semana em segundos, do celular ou do computador.",
  },
  {
    titulo: "Vá ao mercado com o app",
    descricao: "Use o Modo Mercado pra marcar cada item conforme coloca no carrinho.",
  },
  {
    titulo: "Acompanhe seus gastos",
    descricao: "Depois da compra, veja o resumo do mês e compare preços entre mercados.",
  },
];

const BENEFICIOS = [
  "Acesso a todas as funcionalidades",
  "Scanner de código de barras",
  "Comparação de preços entre mercados",
  "Histórico ilimitado de compras",
  "Suporte quando você precisar",
];

export default function LandingPage() {
  function irParaFuncionalidades(e) {
    e.preventDefault();
    document.getElementById("funcionalidades")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="min-h-screen">
      <Header onVerComoFunciona={irParaFuncionalidades} />

      <main>
        <Hero onVerComoFunciona={irParaFuncionalidades} />
        <Features />
        <ComoFunciona />
        <Carrossel />
        <Pricing />
      </main>

      <Footer />
    </div>
  );
}

function Header({ onVerComoFunciona }) {
  return (
    <header className="sticky top-4 z-40 px-4">
      <div className="mx-auto flex max-w-5xl items-center justify-between rounded-2xl border border-ink-900/[0.06] bg-paper/85 px-4 py-3 shadow-soft backdrop-blur-md sm:px-6">
        <img src={logoName} alt="Listamo" className="h-7 w-auto sm:h-8" />
        <nav className="hidden items-center gap-8 sm:flex">
          <a
            href="#funcionalidades"
            onClick={onVerComoFunciona}
            className="text-sm font-medium text-ink-600 transition-colors duration-150 hover:text-ink-900"
          >
            Como funciona
          </a>
          <a href="#preco" className="text-sm font-medium text-ink-600 transition-colors duration-150 hover:text-ink-900">
            Preço
          </a>
        </nav>
        <Button as="a" href={LINK_ASSINAR} variant="forest" size="sm">
          Testar grátis
        </Button>
      </div>
    </header>
  );
}

function Hero({ onVerComoFunciona }) {
  return (
    <section className="relative overflow-hidden px-4 pt-14 pb-20 sm:pt-20 sm:pb-28">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-32 h-96 w-96 rounded-full bg-forest-200/50 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-40 -left-24 h-72 w-72 rounded-full bg-terracotta-100/60 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-5xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
        <div className="animate-rise text-center lg:text-left">
          <h1 className="text-balance font-bebas tracking-wide text-4xl font-semibold leading-[1.08] text-ink-900 sm:text-5xl lg:text-[3.4rem]">
            Sua despensa organizada.
            <br />
            Suas compras no controle.
          </h1>

          <p className="mx-auto mt-5 max-w-md text-pretty text-lg text-ink-600 lg:mx-0">
            O app que monta sua lista, avisa antes do que vencer na despensa e mostra onde comprar
            mais barato toda semana.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Button as="a" href={LINK_ASSINAR} variant="forest" size="lg" className="w-full sm:w-auto">
              Testar grátis por 3 dias
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              as="a"
              href="#funcionalidades"
              onClick={onVerComoFunciona}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
            >
              Ver como funciona
            </Button>
          </div>
        </div>

        <div className="animate-rise flex justify-center lg:justify-end" style={{ animationDelay: "120ms" }}>
          <HeroMockup />
        </div>
      </div>
    </section>
  );
}

function HeroMockup() {
  const videoRef = useRef(null);

  useEffect(() => {
    const reduzMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduzMovimento) videoRef.current?.play().catch(() => {});
  }, []);

  return (
    <div className="relative w-full max-w-[19rem]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 scale-90 rounded-[3.5rem] bg-forest-600/25 blur-3xl"
      />

      {/* moldura do aparelho */}
      <div className="relative rounded-[2.75rem] bg-gradient-to-b from-ink-800 to-ink-900 p-[9px] shadow-lift">
        <span className="pointer-events-none absolute inset-0 rounded-[2.75rem] ring-1 ring-inset ring-cream-50/10" />
        {/* botões laterais */}
        <span className="absolute -right-[2px] top-28 h-14 w-[3px] rounded-full bg-ink-800" />
        <span className="absolute -left-[2px] top-20 h-7 w-[3px] rounded-full bg-ink-800" />
        <span className="absolute -left-[2px] top-32 h-10 w-[3px] rounded-full bg-ink-800" />

        <div className="relative overflow-hidden rounded-[2.25rem] bg-ink-900">
          <video
            ref={videoRef}
            className="aspect-[384/848] w-full object-cover"
            src="/hero-listamo.mp4"
            muted
            loop
            playsInline
            preload="auto"
            aria-label="Demonstração do aplicativo Listamo em uso"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-6 rounded-t-[2.25rem] bg-gradient-to-b from-black/15 to-transparent"
          />
        </div>
      </div>

      <div className="absolute -bottom-5 -left-8 flex items-center gap-2 rounded-2xl border border-ink-900/[0.06] bg-paper px-3.5 py-2.5 shadow-soft-lg">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <Clock className="h-4 w-4" strokeWidth={2.5} />
        </span>
        <div className="leading-tight">
          <p className="text-xs font-semibold text-ink-900">Leite vence em 2 dias</p>
          <p className="text-[0.7rem] text-ink-400">Aviso da despensa</p>
        </div>
      </div>

      <div className="absolute -top-4 -right-6 flex items-center gap-1.5 rounded-full bg-forest-800 px-3 py-1.5 text-[0.7rem] font-semibold text-cream-50 shadow-soft-lg">
        <TrendingDown className="h-3.5 w-3.5" strokeWidth={2.5} />
        R$ 12 mais barato no Extra
      </div>
    </div>
  );
}

function Features() {
  return (
    <section id="funcionalidades" className="bg-cream-100 px-4 py-20 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-balance font-bebas tracking-wide text-3xl font-semibold text-ink-900 sm:text-4xl">
            Tudo que a compra da casa precisa
          </h2>
          <p className="mt-3 text-ink-600">
            Do planejamento ao carrinho, o Listamo acompanha cada etapa da sua rotina de compras.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <Card
              key={f.titulo}
              className={`group p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift ${
                f.destaque ? "sm:col-span-2 sm:flex sm:items-center sm:gap-8" : ""
              }`}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-forest-700 text-cream-50 shadow-soft transition-transform duration-300 group-hover:scale-105">
                <f.icon className="h-5 w-5" strokeWidth={2} />
              </span>
              <div className={f.destaque ? "mt-4 sm:mt-0" : "mt-4"}>
                <h3 className="font-bebas tracking-wide text-lg font-semibold text-ink-900">{f.titulo}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{f.descricao}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function ComoFunciona() {
  return (
    <section className="px-4 py-20 sm:py-28">
      <div className="mx-auto max-w-4xl">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-balance font-bebas tracking-wide text-3xl font-semibold text-ink-900 sm:text-4xl">
            Como funciona
          </h2>
          <p className="mt-3 text-ink-600">Três passos entre criar a lista e economizar no fim do mês.</p>
        </div>

        <ol className="relative mt-14 grid gap-10 sm:grid-cols-3 sm:gap-6">
          <div
            aria-hidden
            className="absolute top-6 left-0 right-0 hidden h-px bg-ink-900/10 sm:block"
            style={{ marginInline: "16.6%" }}
          />
          {PASSOS.map((passo, i) => (
            <li key={passo.titulo} className="relative flex flex-col items-center text-center sm:items-center">
              <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-forest-700 font-display text-lg font-semibold text-cream-50 shadow-soft">
                {i + 1}
              </span>
              <h3 className="mt-5 font-bebas tracking-wide text-lg font-semibold text-ink-900">{passo.titulo}</h3>
              <p className="mt-2 max-w-[15rem] text-sm leading-relaxed text-ink-600">{passo.descricao}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Carrossel() {
  return (
    <section className="overflow-hidden py-16 sm:py-20">
      <div className="mx-auto max-w-xl px-4 text-center">
        <h2 className="text-balance font-display text-3xl font-semibold text-ink-900 sm:text-4xl">
          Por dentro do app
        </h2>
        <p className="mt-3 text-ink-600">Cada tela pensada pra facilitar o dia a dia das compras.</p>
      </div>

      <div className="relative mt-12">
        <div className="flex w-max gap-6 px-4 animate-carrossel-lento">
          {TELAS_APP.map((tela) => (
            <img
              key={tela.src}
              src={tela.src}
              alt={tela.alt}
              className="h-[26rem] w-auto shrink-0 rounded-[1.75rem] border-[6px] border-ink-900 object-cover shadow-lift sm:h-[30rem]"
            />
          ))}
          {TELAS_APP.map((tela) => (
            <img
              key={`${tela.src}-dup`}
              src={tela.src}
              alt=""
              aria-hidden="true"
              className="h-[26rem] w-auto shrink-0 rounded-[1.75rem] border-[6px] border-ink-900 object-cover shadow-lift sm:h-[30rem]"
            />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-cream-100 to-transparent sm:w-28" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-cream-100 to-transparent sm:w-28" />
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="preco" className="bg-cream-100 px-4 py-20 sm:py-28">
      <div className="mx-auto max-w-md">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-balance font-bebas tracking-wide text-3xl font-semibold text-ink-900 sm:text-4xl">
            Um plano só, sem enrolação
          </h2>
          <p className="mt-3 text-ink-600">Tudo liberado desde o primeiro dia.</p>
        </div>

        <Card className="relative mt-10 flex flex-col overflow-hidden border-2 border-ouro-500/50 p-7">
          <span className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-ouro-300 via-ouro-600 to-ouro-300" />
          <span className="efeito-brilho" />

          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ouro-100 text-ouro-700">
            <Medal className="h-5 w-5" strokeWidth={2} />
          </span>
          <h3 className="mt-4 font-bebas tracking-wide text-xl font-semibold text-ink-900">Listamo Premium</h3>
          <p className="mt-1 text-sm text-ink-500">3 dias grátis para testar, cancele quando quiser</p>

          <p className="mt-5 font-display text-5xl font-semibold text-ink-900">
            R$ 32<span className="text-lg font-medium text-ink-400">,00</span>
            <span className="text-base font-medium text-ink-400"> /mês</span>
          </p>

          <ul className="mt-6 flex flex-col gap-2.5">
            {BENEFICIOS.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-sm text-ink-700">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-forest-600" strokeWidth={2.5} />
                {b}
              </li>
            ))}
          </ul>

          <Button as="a" href={LINK_ASSINAR} variant="primary" size="lg" className="mt-8 w-full">
            Assinar Premium <Crown className="h-4 w-4" />
          </Button>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-ink-400">
            <ScanLine className="h-3.5 w-3.5" />
            Inclui scanner de código de barras
          </p>
        </Card>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-forest-950 px-4 py-10">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
        <img src={logoName} alt="Listamo" className="h-7 w-auto brightness-0 invert" />
        <p className="text-sm text-forest-200/70">© 2026 Listamo</p>
      </div>
    </footer>
  );
}
