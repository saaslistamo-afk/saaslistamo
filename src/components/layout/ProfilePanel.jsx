import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, X, Moon, Sun, LogOut, Bell, Trash2, CreditCard, UserRound, Clock, Smartphone } from "lucide-react";
import Button from "../ui/Button";
import Switch from "../ui/Switch";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { useWebPush } from "../../hooks/useWebPush";
import { useTravarScroll } from "../../hooks/useTravarScroll";

function iniciais(nome) {
  return nome.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

export default function ProfilePanel({ aberto, onFechar, onAbrirGuiaInstalacao }) {
  const {
    usuario, plano,
    darkMode, setDarkMode, fotoPerfil, setFotoPerfil,
    nome, setNome, email, setEmail, notificacoes, setNotificacoes,
  } = useApp();
  const { sair } = useAuth();
  const { solicitarPermissao, cancelarSubscription } = useWebPush();
  const navigate = useNavigate();
  const inputFotoRef = useRef(null);
  const [erroFoto, setErroFoto] = useState("");
  const [erroNotif, setErroNotif] = useState("");
  function aoEscolherFoto(e) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    if (!arquivo.type.startsWith("image/")) {
      setErroFoto("Escolha um arquivo de imagem.");
      return;
    }
    setErroFoto("");
    const leitor = new FileReader();
    leitor.onload = () => setFotoPerfil(leitor.result);
    leitor.readAsDataURL(arquivo);
  }

  function irPara(rota) {
    onFechar();
    navigate(rota);
  }

  function aoAbrirGuiaInstalacao() {
    onFechar();
    onAbrirGuiaInstalacao();
  }

  async function aoSair() {
    onFechar();
    await sair();
    navigate("/login");
  }

  async function atualizarNotif(chave, valor) {
    setNotificacoes((prev) => ({ ...prev, [chave]: valor }));
    setErroNotif("");
    if (valor) {
      const resultado = await solicitarPermissao();
      if (!resultado.ok) {
        setErroNotif(resultado.motivo);
        setNotificacoes((prev) => ({ ...prev, [chave]: false }));
      }
    } else {
      const algumAtivo = Object.entries(notificacoes).some(([k, v]) => k !== "horario" && k !== chave && v);
      if (!algumAtivo) await cancelarSubscription();
    }
  }

  function atualizarHorario(novoHorario) {
    setNotificacoes((prev) => ({ ...prev, horario: novoHorario }));
  }

  const algumaNotifAtiva = notificacoes.orcamento || notificacoes.validade || notificacoes.resumoDiario;
  useTravarScroll(aberto);

  return (
    <>
      <div
        onClick={onFechar}
        className={`fixed inset-0 z-40 bg-ink-900/50 backdrop-blur-sm transition-opacity duration-300 ${
          aberto ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-paper shadow-lift transition-transform duration-300 ease-out ${
          aberto ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!aberto}
      >
        <div className="flex items-center justify-between border-b border-ink-900/[0.06] px-5 py-4">
          <h2 className="font-display text-lg font-semibold text-ink-900">Configurações de perfil</h2>
          <button onClick={onFechar} className="cursor-pointer rounded-full p-1.5 text-ink-400 hover:bg-ink-900/5 hover:text-ink-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3 border-b border-ink-900/[0.06] pb-6">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-forest-700 text-2xl font-bold text-cream-50 shadow-soft">
                {fotoPerfil ? (
                  <img src={fotoPerfil} alt="Sua foto de perfil" className="h-full w-full object-cover" />
                ) : (
                  iniciais(nome)
                )}
              </div>
              <button
                onClick={() => inputFotoRef.current?.click()}
                aria-label="Alterar foto de perfil"
                className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-terracotta-500 text-cream-50 shadow-soft hover:bg-terracotta-600"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input ref={inputFotoRef} type="file" accept="image/*" className="hidden" onChange={aoEscolherFoto} />
            </div>
            {erroFoto && <p className="text-xs text-rose-600">{erroFoto}</p>}
            {fotoPerfil && (
              <button onClick={() => setFotoPerfil(null)} className="flex cursor-pointer items-center gap-1 text-xs font-medium text-ink-500 hover:text-rose-600">
                <Trash2 className="h-3 w-3" /> Remover foto
              </button>
            )}
          </div>

          {/* Dados pessoais */}
          <div className="flex flex-col gap-3 border-b border-ink-900/[0.06] py-6">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-ink-600">Nome</span>
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full rounded-xl border border-ink-900/10 bg-paper px-3.5 py-2.5 text-sm text-ink-900 outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/15"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-ink-600">E-mail</span>
              <input
                type="email"
                value={email}
                readOnly
                className="w-full rounded-xl border border-ink-900/10 bg-cream-100 px-3.5 py-2.5 text-sm text-ink-500 outline-none cursor-default"
              />
            </label>
          </div>

          {/* Aparência */}
          <div className="border-b border-ink-900/[0.06] py-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">Aparência</p>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2.5 text-sm font-medium text-ink-800">
                {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                Modo escuro
              </span>
              <Switch checked={darkMode} onChange={setDarkMode} label="Alternar modo escuro" />
            </div>
          </div>

          {/* Notificações */}
          <div className="border-b border-ink-900/[0.06] py-6">
            <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">
              <Bell className="h-3.5 w-3.5" /> Notificações
            </p>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-ink-800">Alerta de orçamento</span>
                <Switch checked={notificacoes.orcamento} onChange={(v) => atualizarNotif("orcamento", v)} label="Alerta de orçamento" />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-ink-800">Validade da despensa</span>
                <Switch checked={notificacoes.validade} onChange={(v) => atualizarNotif("validade", v)} label="Alerta de validade da despensa" />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-ink-800">Resumo diário</span>
                <Switch checked={notificacoes.resumoDiario} onChange={(v) => atualizarNotif("resumoDiario", v)} label="Resumo diário" />
              </div>
            </div>
            {algumaNotifAtiva && (
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-ink-900/[0.06] pt-4">
                <span className="flex items-center gap-2 text-sm font-medium text-ink-800">
                  <Clock className="h-4 w-4 text-ink-400" /> Horário de envio
                </span>
                <input
                  type="time"
                  value={notificacoes.horario ?? "08:00"}
                  onChange={(e) => atualizarHorario(e.target.value)}
                  className="rounded-xl border border-ink-900/10 bg-paper px-3 py-2 text-sm text-ink-900 outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/15"
                />
              </div>
            )}
            {erroNotif && (
              <p className="mt-3 rounded-lg bg-rose-100 px-3.5 py-2.5 text-xs font-medium text-rose-600">{erroNotif}</p>
            )}
          </div>

          {/* Plano */}
          <div className="border-b border-ink-900/[0.06] py-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">Assinatura</p>
            <button
              onClick={() => irPara("/planos")}
              className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-ink-900/[0.06] bg-cream-100 px-4 py-3 text-left hover:border-forest-500/30"
            >
              <span className="flex items-center gap-2.5 text-sm font-medium text-ink-800">
                <CreditCard className="h-4 w-4 text-forest-700" />
                Plano <span className="capitalize">{plano}</span>
              </span>
              <span className="text-xs font-semibold text-terracotta-600">Gerenciar</span>
            </button>
          </div>

          {/* Perfil da casa */}
          <div className="border-b border-ink-900/[0.06] py-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">Casa</p>
            <button
              onClick={() => irPara("/perfil-casa")}
              className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-ink-900/[0.06] bg-cream-100 px-4 py-3 text-left hover:border-forest-500/30"
            >
              <span className="flex items-center gap-2.5 text-sm font-medium text-ink-800">
                <UserRound className="h-4 w-4 text-forest-700" />
                Perfil da casa
              </span>
              <span className="text-xs font-semibold text-terracotta-600">Editar</span>
            </button>
          </div>

          {/* Ajuda */}
          <div className="py-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">Ajuda</p>
            <button
              onClick={aoAbrirGuiaInstalacao}
              className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-ink-900/[0.06] bg-cream-100 px-4 py-3 text-left hover:border-forest-500/30"
            >
              <span className="flex items-center gap-2.5 text-sm font-medium text-ink-800">
                <Smartphone className="h-4 w-4 text-forest-700" />
                Como ativar notificações
              </span>
              <span className="text-xs font-semibold text-terracotta-600">Ver passo a passo</span>
            </button>
          </div>

        </div>

        <div className="border-t border-ink-900/[0.06] p-5">
          <Button variant="outline" className="w-full" onClick={aoSair}>
            <LogOut className="h-4 w-4" /> Sair da conta
          </Button>
        </div>
      </aside>
    </>
  );
}
