import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, Eye, EyeOff, ArrowRight } from "lucide-react";
import Button from "../components/ui/Button";
import { supabase } from "../lib/supabase";
import logoMark from "../assets/logo-mark.png";

export default function ResetPassword() {
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const navigate = useNavigate();

  async function aoEnviar(e) {
    e.preventDefault();
    setErro("");
    if (senha.length < 6) { setErro("A senha deve ter ao menos 6 caracteres."); return; }
    if (senha !== confirmar) { setErro("As senhas não coincidem."); return; }
    setCarregando(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: senha });
      if (error) throw error;
      setSucesso(true);
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (err) {
      setErro("Não foi possível redefinir a senha. Tente solicitar um novo link.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm animate-rise">
        <div className="mb-8 flex justify-center">
          <img src={logoMark} alt="Listamo" className="h-14 w-auto" />
        </div>

        <h1 className="font-display text-3xl font-semibold text-ink-900">Redefinir senha</h1>
        <p className="mt-2 text-sm text-ink-600">Digite sua nova senha abaixo.</p>

        {sucesso ? (
          <div className="mt-6 rounded-xl bg-forest-100 px-4 py-4 text-sm font-medium text-forest-700">
            Senha redefinida com sucesso! Redirecionando...
          </div>
        ) : (
          <form onSubmit={aoEnviar} className="mt-7 flex flex-col gap-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-ink-600">Nova senha</span>
              <span className="flex items-center gap-2.5 rounded-xl border border-ink-900/10 bg-paper px-3.5 py-2.5 shadow-soft-sm focus-within:border-forest-500 focus-within:ring-2 focus-within:ring-forest-500/15">
                <KeyRound className="h-4 w-4 text-ink-400" />
                <input
                  type={verSenha ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400"
                />
                <button type="button" onClick={() => setVerSenha((v) => !v)} className="cursor-pointer text-ink-400 hover:text-ink-600">
                  {verSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-ink-600">Confirmar senha</span>
              <span className="flex items-center gap-2.5 rounded-xl border border-ink-900/10 bg-paper px-3.5 py-2.5 shadow-soft-sm focus-within:border-forest-500 focus-within:ring-2 focus-within:ring-forest-500/15">
                <KeyRound className="h-4 w-4 text-ink-400" />
                <input
                  type={verSenha ? "text" : "password"}
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400"
                />
              </span>
            </label>

            {erro && (
              <p className="rounded-lg bg-rose-100 px-3.5 py-2.5 text-sm font-medium text-rose-600">{erro}</p>
            )}

            <Button type="submit" size="lg" className="mt-2 w-full justify-between" disabled={carregando}>
              {carregando ? "Salvando..." : "Redefinir senha"}
              {!carregando && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
