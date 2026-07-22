import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [planoAssinatura, setPlanoAssinatura] = useState(null);
  const [carregandoAuth, setCarregandoAuth] = useState(true);
  // Separado de carregandoAuth: a sessão resolve antes do plano (busca
  // assíncrona à parte). Sem isso, RotaPrivada via `isPremium` ainda `false`
  // no primeiro render pós-login e manda o usuário pra /planos por engano,
  // mesmo já sendo premium — sempre esperar os dois antes de decidir a rota.
  const [carregandoPlano, setCarregandoPlano] = useState(true);

  // Busca o plano na tabela `assinaturas` (fonte de verdade, só-leitura para o
  // próprio usuário via RLS — só a service role do webhook grava nela).
  // Importante: nunca gravar o plano em user_metadata. Esse campo é editável
  // pelo próprio usuário via supabase.auth.updateUser(), então usá-lo para
  // liberar acesso premium é burlável no console do navegador.
  async function buscarPlanoAssinatura(user) {
    if (!user) return null;
    const { data } = await supabase
      .from("assinaturas")
      .select("plano")
      .eq("email", user.email)
      .single();
    return data?.plano ?? null;
  }

  useEffect(() => {
    // Garante que carregandoAuth vira false mesmo se getSession travar
    const fallback = setTimeout(() => setCarregandoAuth(false), 3000);

    function carregarPlano(user) {
      if (!user) { setCarregandoPlano(false); return; }
      setCarregandoPlano(true);
      // Timeout de segurança: se a consulta travar (rede, RLS, o que for),
      // a UI não pode ficar presa no "carregando" pra sempre — cai pra
      // "trial" depois de 5s, igual ao fallback que já existia pro auth.
      const semResposta = new Promise((resolve) => setTimeout(() => resolve(null), 5000));
      Promise.race([buscarPlanoAssinatura(user), semResposta])
        .then(setPlanoAssinatura)
        .catch(() => {})
        .finally(() => setCarregandoPlano(false));
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(fallback);
      const user = session?.user ?? null;
      setUsuario(user);
      setCarregandoAuth(false);
      carregarPlano(user);
    }).catch(() => {
      clearTimeout(fallback);
      setCarregandoAuth(false);
      setCarregandoPlano(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user ?? null;
      setUsuario(user);
      // INITIAL_SESSION é o primeiro evento ao subscrever — desbloqueia a UI imediatamente
      if (event === "INITIAL_SESSION") {
        clearTimeout(fallback);
        setCarregandoAuth(false);
        carregarPlano(user);
      } else if (event === "SIGNED_IN") {
        carregarPlano(user);
      } else if (event === "SIGNED_OUT") {
        setPlanoAssinatura(null);
        setCarregandoPlano(false);
      }
    });

    return () => { clearTimeout(fallback); subscription.unsubscribe(); };
  }, []);

  async function entrar(email, senha) {
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) throw error;
  }

  async function cadastrar(email, senha) {
    const { data, error } = await supabase.auth.signUp({ email, password: senha });
    if (error) throw error;
    return { confirmacaoPendente: !data.session };
  }

  async function sair() {
    await supabase.auth.signOut();
  }

  async function recuperarSenha(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://listamoapp.vercel.app/redefinir-senha",
    });
    if (error) throw error;
  }

  return (
    <AuthContext.Provider value={{ usuario, planoAssinatura, carregandoAuth, carregandoPlano, entrar, cadastrar, sair, recuperarSenha }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
