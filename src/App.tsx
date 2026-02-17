import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import { AIChatbot } from "@/components/AIChatbot";
import { Analytics } from "@vercel/analytics/react";
import Dashboard from "@/pages/Dashboard";
import StockAnalysis from "@/pages/StockAnalysis";
import Sectors from "@/pages/Sectors";
import Multibagger from "@/pages/Multibagger";
//screeners 
import Screeners from "@/pages/Screeners";
import NearResistance from "@/pages/NearResistance";
import SupportReversal from "@/pages/SupportReversal";
import ReactionZone from "@/pages/ReactionZone";
import Backtests from "@/pages/Backtests";
import Admin from "@/pages/Admin";
import NotFound from "./pages/NotFound";
import LandingPage from "@/pages/Landing";
import { startAutoRefresh } from "@/lib/googleSheetsService";
import { OnboardingModal } from "@/components/ui/OnboardingModal";
import { CountrySelectionModal, type CountryId } from "@/components/ui/CountrySelectionModal";



import { SplashScreen } from "@/components/ui/SplashScreen";
import { useLiveData } from "@/hooks/useLiveData";

const queryClient = new QueryClient();

const AppContent = () => {
  const [showLanding, setShowLanding] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showCountrySelection, setShowCountrySelection] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryId | null>(null);
  const { isLoading } = useLiveData();
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    const hasEntered = sessionStorage.getItem("hasEntered");
    if (hasEntered) {
      setShowLanding(false);
    }

    // Load saved country selection
    const savedCountry = localStorage.getItem("selectedCountry") as CountryId | null;
    if (savedCountry) {
      setSelectedCountry(savedCountry);
    }

    startAutoRefresh();
  }, []);

  // Handle progress simulation when loading starts
  useEffect(() => {
    if (!showLanding && isLoading) {
      setLoadingProgress(0);
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 95) return prev;
          // Slowly approach 95%
          const increment = Math.max(0.5, (95 - prev) / 20);
          return prev + increment;
        });
      }, 100);
      return () => clearInterval(interval);
    } else if (!isLoading) {
      setLoadingProgress(100);
    }
  }, [showLanding, isLoading]);

  const handleEnter = () => {
    setShowLanding(false);
    sessionStorage.setItem("hasEntered", "true");

    // Check if onboarding is needed in this session
    const hasSeenOnboarding = sessionStorage.getItem("hasSeenOnboarding");
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    sessionStorage.setItem("hasSeenOnboarding", "true");

    // Check if country is already selected
    if (!selectedCountry) {
      setShowCountrySelection(true);
    } else {
      // Notify other components that onboarding is finished
      window.dispatchEvent(new CustomEvent("onboardingComplete"));
    }
  };

  const handleCountrySelect = (countryId: CountryId) => {
    setSelectedCountry(countryId);
    localStorage.setItem("selectedCountry", countryId);
    setShowCountrySelection(false);
    // Notify other components that onboarding is finished
    window.dispatchEvent(new CustomEvent("onboardingComplete"));
  };

  const handleCountryChange = (countryId: CountryId) => {
    setSelectedCountry(countryId);
    localStorage.setItem("selectedCountry", countryId);
    // You could add a toast notification here
  };

  if (showLanding) {
    return <LandingPage onEnter={handleEnter} />;
  }

  // Show splash screen if live data is still loading after entering
  // We allow a small delay for the 100% state to be visible before transitioning
  if (isLoading || loadingProgress < 100) {
    return <SplashScreen progress={loadingProgress} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <OnboardingModal
        isOpen={showOnboarding}
        onOpenChange={setShowOnboarding}
        onComplete={handleOnboardingComplete}
      />
      <CountrySelectionModal
        isOpen={showCountrySelection}
        onSelect={handleCountrySelect}
      />
      <Navbar selectedCountry={selectedCountry} onCountryChange={handleCountryChange} />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/stocks" element={<StockAnalysis />} />
        <Route path="/sectors" element={<Sectors />} />
        <Route path="/multibagger" element={<Multibagger />} />
        <Route path="/screeners" element={<Screeners />} />
        <Route path="/screeners/near-resistance" element={<NearResistance />} />
        <Route path="/screeners/support-reversal" element={<SupportReversal />} />
        <Route path="/screeners/reaction-zone" element={<ReactionZone />} />
        <Route path="/backtests" element={<Backtests />} />
        <Route path="/admin" element={<Admin />} />
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
          <Analytics />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
