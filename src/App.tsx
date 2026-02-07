import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { BancaProvider } from "@/contexts/BancaContext";
import { ZapierProvider } from "@/contexts/ZapierContext";
import Index from "./pages/Index";
import Estatisticas from "./pages/Estatisticas";
import Entradas from "./pages/Entradas";
import Banca from "./pages/Banca";
import Saldos from "./pages/Saldos";
import Configuracoes from "./pages/Configuracoes";
import Suporte from "./pages/Suporte";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
        <Route path="/estatisticas" element={<ProtectedRoute><Estatisticas /></ProtectedRoute>} />
        <Route path="/entradas" element={<ProtectedRoute><Entradas /></ProtectedRoute>} />
        <Route path="/banca" element={<ProtectedRoute><Banca /></ProtectedRoute>} />
        <Route path="/saldos" element={<ProtectedRoute><Saldos /></ProtectedRoute>} />
        <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
        <Route path="/suporte" element={<ProtectedRoute><Suporte /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <BancaProvider>
          <ZapierProvider>
            <Toaster />
            <Sonner />
            <AppRoutes />
          </ZapierProvider>
        </BancaProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
