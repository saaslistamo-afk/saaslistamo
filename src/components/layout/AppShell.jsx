import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, ListPlus, Archive, History,
  Lock, X, Scale, ChevronDown, CloudOff,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { useWebPush } from "../../hooks/useWebPush";
import { deveNotificarAntecedencia, marcoAntecedenciaAtingido } from "../../mock/data";
import Badge from "../ui/Badge";
import logoName from "../../assets/logo-name.png";
import logoNameDark from "../../assets/logo-name-dark.png";
import logoMark from "../../assets/logo-mark.png";
import logoMarkDark from "../../assets/logo-mark-dark.png";
import ProfilePanel from "./ProfilePanel";
import GuiaInstalacao from "../ui/GuiaInstalacao";

const NAV = [
  { to: "/dashboard",      label: "Dashboard",       icon: LayoutDashboard },
  { to: "/nova-lista",     label: "Nova lista",       icon: ListPlus },
  { to: "/comparar-precos",label: "Comparar preços",  icon: Scale, destaque: true },
  { to: "/despensa",       label: "Despensa",          icon: Archive },
  { to: "/historico",      label: "Histórico",         icon: History },
];

function iniciais(nome) {
  return nome.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

export default function AppShell({ children }) {
  const {
    usuario, plano, setPlano, isPremium, trialAtivo, trialBannerVisivel, setTrialBannerVisivel,
    fotoPerfil, darkMode, notificacoes, despensa, editarItemDespensa, orcamento, gastoMes, sincronizado, erroSincronizacao,
    boasVindasPremium, setBoasVindasPremium,
  } = useApp();
  const { notificarLocal } = useWebPush();
  const navigate = useNavigate();
  const [menuPlanoAberto, setMenuPlanoAberto] = useState(false);
  const [painelPerfilAberto, setPainelPerfilAberto] = useState(false);
  const [guiaInstalacaoAberto, setGuiaInstalacaoAberto] = useState(false);
  const [guiaComoBoasVindas, setGuiaComoBoasVindas] = useState(false);

  // Assinou o Premium de verdade (não trial) e ainda não viu o passo a passo
  // de instalação — sem adicionar à tela de início, a notificação push não
  // funciona no iPhone/Android, e um cliente leigo não vai saber fazer isso
  // sozinho.
  useEffect(() => {
    if (plano === "premium" && !boasVindasPremium) {
      setGuiaComoBoasVindas(true);
      setGuiaInstalacaoAberto(true);
    }
  }, [plano, boasVindasPremium]);

  function abrirGuiaInstalacao() {
    setGuiaComoBoasVindas(false);
    setGuiaInstalacaoAberto(true);
  }

  function fecharGuiaInstalacao() {
    setGuiaInstalacaoAberto(false);
    if (guiaComoBoasVindas) {
      setBoasVindasPremium(true);
      setGuiaComoBoasVindas(false);
    }
  }

  // verifica condições locais e mostra notificações quando o app abre
  useEffect(() => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    // Sem esperar sincronizado, essa checagem rodava com despensa/orçamento
    // do localStorage em cache (antes do Supabase responder) — como só roda
    // 1x/dia, uma checagem prematura com dado desatualizado significava não
    // checar de novo naquele dia com o dado certo.
    if (!sincronizado) return;

    const hoje = new Date().toISOString().slice(0, 10);
    const ultimaVerif = localStorage.getItem("listamo:ultimaVerifNotif");
    if (ultimaVerif === hoje) return; // só verifica uma vez por dia
    localStorage.setItem("listamo:ultimaVerifNotif", hoje);

    if (notificacoes.validade) {
      const antecedenciaDias = notificacoes.antecedenciaDias?.length ? notificacoes.antecedenciaDias : [3];
      const criticos = despensa.filter((d) => deveNotificarAntecedencia(d, antecedenciaDias));
      if (criticos.length > 0) {
        notificarLocal(
          "Atenção na despensa!",
          `${criticos.length} ${criticos.length === 1 ? "item está" : "itens estão"} vencendo ou vencidos. Confira agora.`,
          "/despensa"
        );
        // Marca o marco de antecedência já avisado (vencido não usa marca
        // d'água, sempre notifica de novo) — sem isso, o mesmo item repetiria
        // o aviso todo santo dia enquanto continuasse na mesma janela.
        criticos.forEach((d) => {
          const marco = marcoAntecedenciaAtingido(d.dataValidade, antecedenciaDias);
          if (marco !== -1) editarItemDespensa(d.id, { ultimaAntecedenciaNotificada: marco });
        });
      }
    }

    if (notificacoes.orcamento && orcamento > 0 && gastoMes >= orcamento * 0.8) {
      notificarLocal(
        "Orçamento quase no limite",
        `Você já usou ${Math.round((gastoMes / orcamento) * 100)}% do orçamento do mês.`,
        "/dashboard"
      );
    }
    // Deliberadamente sem despensa/notificacoes/orcamento/gastoMes nas deps:
    // só deve rodar de novo quando sincronizado passa a true, não a cada
    // edição — o gate de "1x por dia" já cuida do resto.
  }, [sincronizado]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col border-r border-ink-900/[0.06] bg-paper/60 px-5 py-6">
        <Logo darkMode={darkMode} />
        <nav className="mt-9 flex flex-1 flex-col gap-1">
          {NAV.map((item) => (
            <NavItem key={item.to} item={item} liberado={isPremium} navigate={navigate} />
          ))}
        </nav>
        <PlanoBadge plano={plano} />
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="relative z-30 flex items-center justify-between gap-3 border-b border-ink-900/[0.06] bg-paper/80 px-4 py-3 backdrop-blur-sm lg:px-8">
          <div className="lg:hidden">
            <Logo compact darkMode={darkMode} />
          </div>
          <div className="flex flex-1 items-center justify-end gap-3">
            {/* seletor de plano — visível só em desenvolvimento local */}
            {import.meta.env.DEV && (
              <div className="relative">
                <button
                  onClick={() => setMenuPlanoAberto((v) => !v)}
                  className="flex items-center gap-1.5 rounded-full border border-ink-900/10 bg-paper px-3 py-1.5 text-xs font-semibold text-ink-600 shadow-soft-sm cursor-pointer hover:border-ink-900/20"
                >
                  Dev: <span className="capitalize text-forest-700">{plano}</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                {menuPlanoAberto && (
                  <div className="absolute right-0 z-20 mt-2 w-36 overflow-hidden rounded-xl border border-ink-900/10 bg-paper shadow-soft-lg">
                    {["trial", "premium"].map((p) => (
                      <button
                        key={p}
                        onClick={() => { setPlano(p); setMenuPlanoAberto(false); }}
                        className={`block w-full px-4 py-2.5 text-left text-sm capitalize cursor-pointer hover:bg-ink-900/[0.04] ${p === plano ? "font-semibold text-terracotta-600" : "text-ink-700"}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {erroSincronizacao && (
              <Badge
                tone="amber"
                title="Não foi possível salvar as últimas alterações no servidor. Elas continuam salvas neste aparelho e o app vai tentar de novo."
              >
                <CloudOff className="h-3.5 w-3.5" /> Não sincronizado
              </Badge>
            )}
            <button
              onClick={() => setPainelPerfilAberto(true)}
              aria-label="Abrir configurações de perfil"
              className="flex h-9 w-9 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-forest-700 text-xs font-bold text-cream-50 ring-2 ring-transparent transition-shadow duration-150 hover:ring-forest-500/40"
            >
              {fotoPerfil ? (
                <img src={fotoPerfil} alt="" className="h-full w-full object-cover" />
              ) : (
                iniciais(usuario.nome)
              )}
            </button>
          </div>
        </header>

        {plano === "trial" && trialAtivo && trialBannerVisivel && (
          <div className="flex items-center justify-between gap-3 bg-terracotta-500 px-4 py-2.5 text-sm text-cream-50 lg:px-8">
            <p>
              <strong className="font-semibold">
                Seu teste termina em {usuario.trialDiasRestantes} {usuario.trialDiasRestantes === 1 ? "dia" : "dias"}.
              </strong>{" "}
              Escolha um plano para não perder o acesso.
            </p>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => navigate("/planos")}
                className="rounded-full bg-cream-50 px-3 py-1 text-xs font-semibold text-terracotta-600 cursor-pointer hover:bg-cream-100"
              >
                Ver planos
              </button>
              <button onClick={() => setTrialBannerVisivel(false)} className="cursor-pointer text-cream-50/80 hover:text-cream-50">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1 px-4 py-6 pb-24 lg:px-8 lg:py-8 lg:pb-8">{children}</main>
      </div>

      {/* Bottom nav mobile */}
      <div className="fixed inset-x-0 bottom-0 z-30 lg:hidden">
        <nav className="no-scrollbar flex items-center gap-1 overflow-x-auto border-t border-ink-900/[0.08] bg-paper/95 px-2 py-2 backdrop-blur-sm">
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={isPremium ? item.to : "/planos"}
              className={({ isActive }) =>
                `flex w-16 shrink-0 flex-col items-center gap-1 rounded-lg py-1.5 cursor-pointer ${
                  item.destaque
                    ? isActive && isPremium ? "bg-terracotta-500 text-cream-50" : "text-terracotta-600"
                    : isActive && isPremium ? "text-forest-700" : "text-ink-500"
                }`
              }
            >
              <span className="relative">
                <Icon className="h-5 w-5" strokeWidth={2} />
                {!isPremium && (
                  <Lock className="absolute -right-1.5 -top-1.5 h-3 w-3 rounded-full bg-terracotta-500 p-[1px] text-cream-50" />
                )}
              </span>
              <span className="text-[0.65rem] font-medium">{item.label.split(" ")[0]}</span>
            </NavLink>
          );
        })}
        </nav>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-paper to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-paper to-transparent" />
      </div>

      <ProfilePanel
        aberto={painelPerfilAberto}
        onFechar={() => setPainelPerfilAberto(false)}
        onAbrirGuiaInstalacao={abrirGuiaInstalacao}
      />

      {guiaInstalacaoAberto && (
        <GuiaInstalacao boasVindas={guiaComoBoasVindas} onFechar={fecharGuiaInstalacao} />
      )}
    </div>
  );
}

function Logo({ compact = false, darkMode = false }) {
  if (compact) {
    return <img src={darkMode ? logoMarkDark : logoMark} alt="Listamo" className="h-8 w-auto" />;
  }
  return <img src={darkMode ? logoNameDark : logoName} alt="Listamo" className="h-9 w-auto" />;
}

function NavItem({ item, liberado, navigate }) {
  const Icon = item.icon;

  if (item.destaque) {
    if (!liberado) {
      return (
        <button
          onClick={() => navigate("/planos")}
          className="flex items-center justify-between rounded-xl border border-terracotta-500/30 bg-terracotta-100 px-3.5 py-2.5 text-sm font-semibold text-terracotta-700 cursor-pointer transition-colors duration-150 hover:bg-terracotta-100/70"
        >
          <span className="flex items-center gap-3">
            <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
            {item.label}
          </span>
          <Lock className="h-3.5 w-3.5" />
        </button>
      );
    }
    return (
      <NavLink
        to={item.to}
        className={({ isActive }) =>
          `flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition-colors duration-150 ${
            isActive
              ? "border-terracotta-600 bg-terracotta-500 text-cream-50 shadow-soft"
              : "border-terracotta-500/30 bg-terracotta-100 text-terracotta-700 hover:bg-terracotta-100/70"
          }`
        }
      >
        <span className="flex items-center gap-3">
          <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
          {item.label}
        </span>
        <Badge tone="terracotta" className="bg-cream-50 text-terracotta-600">NOVO</Badge>
      </NavLink>
    );
  }

  if (!liberado) {
    return (
      <button
        onClick={() => navigate("/planos")}
        className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium text-ink-400 cursor-pointer hover:bg-ink-900/[0.04]"
      >
        <span className="flex items-center gap-3">
          <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
          {item.label}
        </span>
        <Lock className="h-3.5 w-3.5" />
      </button>
    );
  }
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors duration-150 ${
          isActive ? "bg-forest-700 text-cream-50 shadow-soft" : "text-ink-700 hover:bg-ink-900/[0.04]"
        }`
      }
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
      {item.label}
    </NavLink>
  );
}

function PlanoBadge({ plano }) {
  return (
    <div className="mt-4 rounded-xl border border-ink-900/[0.06] bg-cream-100 px-3.5 py-3 text-xs">
      <p className="font-semibold text-ink-700 capitalize">Plano {plano}</p>
      <p className="mt-0.5 text-ink-400">Gerencie sua assinatura</p>
    </div>
  );
}
