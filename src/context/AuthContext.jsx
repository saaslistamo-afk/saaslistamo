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
  const [usuario, setUsuario] = useState(undefined); // undefined = ainda carregando

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
