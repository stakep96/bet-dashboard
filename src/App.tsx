import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BancaProvider } from "@/contexts/BancaContext";
import Index from "./pages/Index";
import Estatisticas from "./pages/Estatisticas";
import Entradas from "./pages/Entradas";
import Calendario from "./pages/Calendario";
import Banca from "./pages/Banca";
import Configuracoes from "./pages/Configuracoes";
import Suporte from "./pages/Suporte";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BancaProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/estatisticas" element={<Estatisticas />} />
            <Route path="/entradas" element={<Entradas />} />
            <Route path="/calendario" element={<Calendario />} />
            <Route path="/banca" element={<Banca />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="/suporte" element={<Suporte />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </BancaProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;