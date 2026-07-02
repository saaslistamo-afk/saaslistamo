import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import AppShell from "./components/layout/AppShell";
import Login from "./pages/Login";
import { useAuth } from "./context/AuthContext";
import { useApp } from "./context/AppContext";
import { supabase } from "./lib/supabase";

const Dashboard        = lazy(() => import("./pages/Dashboard"));
const ResetPassword    = lazy(() => import("./pages/ResetPassword"));
const PlanSelect       = lazy(() => import("./pages/PlanSelect"));
const NewList          = lazy(() => import("./pages/NewList"));
const MarketMode       = lazy(() => import("./pages/MarketMode"));
const Pantry           = lazy(() => import("./pages/Pantry"));
const ComparePrices    = lazy(() => import("./pages/ComparePrices"));
const History          = lazy(() => import("./pages/History"));
const HouseholdProfile = lazy(() => import("./pages/HouseholdProfile"));

function RotaPrivada({ children, exigeAssinatura = true }) {
  const { usuario, carregandoAuth } = useAuth();
  const { isPremium } = useApp();
  if (carregandoAuth) return null;
  if (!usuario) return <Navigate to="/login" replace />;
  if (exigeAssinatura && !isPremium) return <Navigate to="/planos" replace />;
  return children;
}

function RotaPublica({ children }) {
  const { usuario, carregandoAuth } = useAuth();
  if (carregandoAuth) return null;
  if (usuario) return <Navigate to="/dashboard" replace />;
  return children;
}

function ComShell({ children }) {
  return <AppShell>{children}</AppShell>;
}

export default function App() {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        navigate("/redefinir-senha");
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/"                element={<Navigate to="/login" replace />} />
        <Route path="/login"           element={<RotaPublica><Login /></RotaPublica>} />
        <Route path="/redefinir-senha" element={<ResetPassword />} />
        <Route path="/planos"          element={<RotaPrivada exigeAssinatura={false}><PlanSelect /></RotaPrivada>} />
        <Route path="/dashboard"       element={<RotaPrivada><ComShell><Dashboard /></ComShell></RotaPrivada>} />
        <Route path="/nova-lista"      element={<RotaPrivada><ComShell><NewList /></ComShell></RotaPrivada>} />
        <Route path="/modo-mercado"    element={<RotaPrivada><ComShell><MarketMode /></ComShell></RotaPrivada>} />
        <Route path="/despensa"        element={<RotaPrivada><ComShell><Pantry /></ComShell></RotaPrivada>} />
        <Route path="/comparar-precos" element={<RotaPrivada><ComShell><ComparePrices /></ComShell></RotaPrivada>} />
        <Route path="/historico"       element={<RotaPrivada><ComShell><History /></ComShell></RotaPrivada>} />
        <Route path="/perfil-casa"     element={<RotaPrivada><ComShell><HouseholdProfile /></ComShell></RotaPrivada>} />
        <Route path="*"               element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
