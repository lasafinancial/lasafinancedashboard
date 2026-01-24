import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import { AIChatbot } from "@/components/AIChatbot";
import Dashboard from "@/pages/Dashboard";
import StockAnalysis from "@/pages/StockAnalysis";
import Sectors from "@/pages/Sectors";
import Multibagger from "@/pages/Multibagger";
import Backtests from "@/pages/Backtests";
import NotFound from "./pages/NotFound";
import LandingPage from "@/pages/Landing";
import { startAutoRefresh } from "@/lib/googleSheetsService";

const queryClient = new QueryClient();

const AppContent = () => {
  const [showLanding, setShowLanding] = useState(true);

  useEffect(() => {
    const hasEntered = sessionStorage.getItem("hasEntered");
    if (hasEntered) {
      setShowLanding(false);
    }
    startAutoRefresh();
  }, []);

  const handleEnter = () => {
    setShowLanding(false);
    sessionStorage.setItem("hasEntered", "true");
  };

  if (showLanding) {
    return <LandingPage onEnter={handleEnter} />;
  }

    return (
      <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
        <Navbar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/stocks" element={<StockAnalysis />} />
          <Route path="/sectors" element={<Sectors />} />
          <Route path="/multibagger" element={<Multibagger />} />
          <Route path="/backtests" element={<Backtests />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <AIChatbot />
      </div>
    );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
