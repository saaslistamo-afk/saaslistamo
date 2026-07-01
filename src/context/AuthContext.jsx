import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../lib/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // começa como null (não logado) em vez de undefined (carregando)
  // → mostra login imediatamente; se houver sessão ativa, Firebase redireciona
  // automaticamente em 2-3s sem mostrar nenhum spinner
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const cancelar = onAuthStateChanged(auth, (u) => setUsuario(u ?? null));
    return cancelar;
  }, []);

  function cadastrar(email, senha) {
    return createUserWithEmailAndPassword(auth, email, senha);
  }

  function entrar(email, senha) {
    return signInWithEmailAndPassword(auth, email, senha);
  }

  function sair() {
    return signOut(auth);
  }

  function recuperarSenha(email) {
    return sendPasswordResetEmail(auth, email);
  }

  return (
    <AuthContext.Provider value={{ usuario, cadastrar, entrar, sair, recuperarSenha }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
