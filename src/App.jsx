import { Navigate, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import AppShell from "./components/layout/AppShell";
import Login from "./pages/Login";
import { useAuth } from "./context/AuthContext";

const Dashboard       = lazy(() => import("./pages/Dashboard"));
const PlanSelect      = lazy(() => import("./pages/PlanSelect"));
const NewList         = lazy(() => import("./pages/NewList"));
const MarketMode      = lazy(() => import("./pages/MarketMode"));
const Pantry          = lazy(() => import("./pages/Pantry"));
const ComparePrices   = lazy(() => import("./pages/ComparePrices"));
const History         = lazy(() => import("./pages/History"));
const HouseholdProfile = lazy(() => import("./pages/HouseholdProfile"));

function RotaPrivada({ children }) {
  const { usuario } = useAuth();

  // só aguarda o Firebase Auth resolver (rápido) — dados do Firestore
  // carregam em segundo plano enquanto o app já está visível
  if (usuario === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-100">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-forest-200 border-t-forest-700" />
          <p className="text-sm font-medium text-ink-400">Carregando...</p>
        </div>
      </div>
    );
  }
  if (usuario === null) return <Navigate to="/login" replace />;
  return children;
}

function RotaPublica({ children }) {
  const { usuario } = useAuth();
  if (usuario === undefined) return null;
  if (usuario !== null) return <Navigate to="/dashboard" replace />;
  return children;
}

function ComShell({ children }) {
  return <AppShell>{children}</AppShell>;
}

export default function App() {
  return (
    <Suspense fallback={null}>
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<RotaPublica><Login /></RotaPublica>} />
      <Route path="/planos" element={<RotaPrivada><PlanSelect /></RotaPrivada>} />
      <Route path="/dashboard" element={<RotaPrivada><ComShell><Dashboard /></ComShell></RotaPrivada>} />
      <Route path="/nova-lista" element={<RotaPrivada><ComShell><NewList /></ComShell></RotaPrivada>} />
      <Route path="/modo-mercado" element={<RotaPrivada><ComShell><MarketMode /></ComShell></RotaPrivada>} />
      <Route path="/despensa" element={<RotaPrivada><ComShell><Pantry /></ComShell></RotaPrivada>} />
      <Route path="/comparar-precos" element={<RotaPrivada><ComShell><ComparePrices /></ComShell></RotaPrivada>} />
      <Route path="/historico" element={<RotaPrivada><ComShell><History /></ComShell></RotaPrivada>} />
      <Route path="/perfil-casa" element={<RotaPrivada><ComShell><HouseholdProfile /></ComShell></RotaPrivada>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
    </Suspense>
  );
}
