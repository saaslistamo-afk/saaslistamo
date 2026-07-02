import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregandoAuth, setCarregandoAuth] = useState(true);

  // Verifica tabela assinaturas e promove para premium se encontrar registro
  async function verificarEPromover(user) {
    if (!user || user.user_metadata?.plano === "premium") return user;

    const { data } = await supabase
      .from("assinaturas")
      .select("plano")
      .eq("email", user.email)
      .single();

    if (data?.plano === "premium") {
      const { data: atualizado } = await supabase.auth.updateUser({
        data: { plano: "premium" },
      });
      return atualizado?.user ?? user;
    }
    return user;
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null;
      setUsuario(user);
      setCarregandoAuth(false);
      if (user) verificarEPromover(user).then(setUsuario).catch(() => {});
    }).catch(() => {
      setCarregandoAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user ?? null;
      setUsuario(user);
      if (user && event === "SIGNED_IN") {
        verificarEPromover(user).then(setUsuario).catch(() => {});
      }
    });

    return () => subscription.unsubscribe();
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
    <AuthContext.Provider value={{ usuario, carregandoAuth, entrar, cadastrar, sair, recuperarSenha }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
