import { Navigate, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import AppShell from "./components/layout/AppShell";
import Login from "./pages/Login";

const Dashboard        = lazy(() => import("./pages/Dashboard"));
const PlanSelect       = lazy(() => import("./pages/PlanSelect"));
const NewList          = lazy(() => import("./pages/NewList"));
const MarketMode       = lazy(() => import("./pages/MarketMode"));
const Pantry           = lazy(() => import("./pages/Pantry"));
const ComparePrices    = lazy(() => import("./pages/ComparePrices"));
const History          = lazy(() => import("./pages/History"));
const HouseholdProfile = lazy(() => import("./pages/HouseholdProfile"));

function ComShell({ children }) {
  return <AppShell>{children}</AppShell>;
}

export default function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/"               element={<Navigate to="/dashboard" replace />} />
        <Route path="/login"          element={<Login />} />
        <Route path="/planos"         element={<PlanSelect />} />
        <Route path="/dashboard"      element={<ComShell><Dashboard /></ComShell>} />
        <Route path="/nova-lista"     element={<ComShell><NewList /></ComShell>} />
        <Route path="/modo-mercado"   element={<ComShell><MarketMode /></ComShell>} />
        <Route path="/despensa"       element={<ComShell><Pantry /></ComShell>} />
        <Route path="/comparar-precos"element={<ComShell><ComparePrices /></ComShell>} />
        <Route path="/historico"      element={<ComShell><History /></ComShell>} />
        <Route path="/perfil-casa"    element={<ComShell><HouseholdProfile /></ComShell>} />
        <Route path="*"              element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
