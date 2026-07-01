import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, KeyRound, Eye, EyeOff, ArrowRight, Carrot, Croissant, Milk, ShoppingBasket } from "lucide-react";
import Button from "../components/ui/Button";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import logoNova from "../assets/logo-nova.png";
import logoMark from "../assets/logo-mark.png";

export default function Login() {
  const [modo, setModo] = useState("entrar"); // "entrar" | "criar"
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const { entrar, cadastrar } = useAuth();
  const navigate = useNavigate();

  async function aoEnviar(e) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      if (modo === "entrar") {
        await entrar(email, senha);
      } else {
        await cadastrar(email, senha);
      }
      navigate("/dashboard");
    } catch (err) {
      setErro(traduzirErro(err.code));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Painel ilustrado — escondido em mobile */}
      <div className="relative hidden w-[44%] flex-col justify-between overflow-hidden bg-forest-800 p-12 text-cream-50 lg:flex">
        <div className="paper-grain absolute inset-0" />
        <div
          className="absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, var(--color-terracotta-400), transparent 70%)" }}
        />
        <div
          className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, var(--color-cream-50), transparent 70%)" }}
        />

        <div className="relative z-10 flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cream-50 p-1.5 shadow-soft">
            <img src={logoMark} alt="" className="h-full w-full object-contain" />
          </div>
          <span className="font-display text-2xl font-semibold">Listamo</span>
        </div>

        <div className="relative z-10 max-w-sm">
          <p className="font-display text-[2.4rem] leading-[1.12] font-medium">
            A casa toda organizada, sem planilha e sem esquecer nada.
          </p>
          <p className="mt-4 text-forest-200/90">
            Liste, controle o orçamento e acompanhe a validade da despensa em um único lugar.
          </p>

          <div className="mt-9 flex gap-3">
            {[Carrot, Milk, Croissant, ShoppingBasket].map((Icon, i) => (
              <span
                key={i}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-cream-50/10 text-cream-50 backdrop-blur-sm animate-rise"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-forest-200/70">
          "Desde que uso, nunca mais deixei o leite vencer." — usuária Premium
        </p>
      </div>

      {/* Formulário */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm animate-rise">
          <div className="mb-8 flex justify-center lg:hidden" style={{ marginTop: "-3%" }}>
            <img src={logoNova} alt="Listamo" className="h-48 w-auto" />
          </div>

          <div style={{ transform: "translateY(-10vh)" }}>
          <h1 className="font-display text-3xl font-semibold text-ink-900">
            {modo === "entrar" ? "Bem-vinda de volta" : "Comece seu teste gratuito"}
          </h1>
          <p className="mt-2 text-sm text-ink-600">
            {modo === "entrar"
              ? "Entre para continuar organizando as compras da casa."
              : "4 dias com acesso completo ao plano Premium, sem cartão."}
          </p>

          <form onSubmit={aoEnviar} className="mt-7 flex flex-col gap-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-ink-600">E-mail</span>
              <span className="flex items-center gap-2.5 rounded-xl border border-ink-900/10 bg-paper px-3.5 py-2.5 shadow-soft-sm focus-within:border-forest-500 focus-within:ring-2 focus-within:ring-forest-500/15">
                <Mail className="h-4 w-4 text-ink-400" strokeWidth={2} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@email.com"
                  required
                  className="w-full bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-ink-600">Senha</span>
              <span className="flex items-center gap-2.5 rounded-xl border border-ink-900/10 bg-paper px-3.5 py-2.5 shadow-soft-sm focus-within:border-forest-500 focus-within:ring-2 focus-within:ring-forest-500/15">
                <KeyRound className="h-4 w-4 text-ink-400" strokeWidth={2} />
                <input
                  type={verSenha ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400"
                />
                <button type="button" onClick={() => setVerSenha((v) => !v)} className="cursor-pointer text-ink-400 hover:text-ink-600">
                  {verSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </label>

            {erro && (
              <p className="rounded-lg bg-rose-100 px-3.5 py-2.5 text-sm font-medium text-rose-600">{erro}</p>
            )}

            <Button type="submit" size="lg" className="mt-2 w-full justify-between" disabled={carregando}>
              {carregando ? "Aguarde..." : modo === "entrar" ? "Entrar" : "Criar minha conta"}
              {!carregando && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-600">
            {modo === "entrar" ? "Ainda não tem conta?" : "Já tem uma conta?"}{" "}
            <button
              onClick={() => { setModo(modo === "entrar" ? "criar" : "entrar"); setErro(""); }}
              className="cursor-pointer font-semibold text-terracotta-600 hover:text-terracotta-700"
            >
              {modo === "entrar" ? "Criar conta gratuita" : "Entrar"}
            </button>
          </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function traduzirErro(code) {
  const mensagens = {
    "auth/invalid-credential":      "E-mail ou senha incorretos.",
    "auth/user-not-found":          "Nenhuma conta com esse e-mail.",
    "auth/wrong-password":          "Senha incorreta.",
    "auth/email-already-in-use":    "Esse e-mail já tem uma conta. Tente entrar.",
    "auth/weak-password":           "Senha muito fraca — use ao menos 6 caracteres.",
    "auth/invalid-email":           "E-mail inválido.",
    "auth/too-many-requests":       "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
    "auth/network-request-failed":  "Sem conexão. Verifique sua internet.",
  };
  return mensagens[code] ?? "Algo deu errado. Tente novamente.";
}
