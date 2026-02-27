import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
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
import IntradayBreakout from "@/pages/IntradayBreakout";
import Backtests from "@/pages/Backtests";
import Admin from "@/pages/Admin";
import Help from "@/pages/Help";
import NotFound from "./pages/NotFound";
import LandingPage from "@/pages/Landing";
import { startAutoRefresh } from "@/lib/googleSheetsService";
import { OnboardingModal } from "@/components/ui/OnboardingModal";
import { CountrySelectionModal, type CountryId } from "@/components/ui/CountrySelectionModal";
import { TraderTypeModal, type TraderType } from "@/components/ui/TraderTypeModal";
import { DisclaimerModal } from "@/components/auth/DisclaimerModal";



import { SplashScreen } from "@/components/ui/SplashScreen";
import { useLiveData } from "@/hooks/useLiveData";
import { useActivityLogger } from "@/hooks/useActivityLogger";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Login from "@/pages/Login";
import { FEATURE_FLAGS } from "@/lib/featureFlags";

const queryClient = new QueryClient();

const AppContent = () => {
  const [showLanding, setShowLanding] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showCountrySelection, setShowCountrySelection] = useState(false);
  const [showTraderTypeSelection, setShowTraderTypeSelection] = useState(false);
  const [onboardingFinishedSesssion, setOnboardingFinishedSession] = useState(false);
  const { userData, updateUserData, user } = useAuth();
  const [selectedCountry, setSelectedCountry] = useState<CountryId>('india');
  const { isLoading } = useLiveData();
  const [loadingProgress, setLoadingProgress] = useState(0);
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  useEffect(() => {
    const hasEntered = sessionStorage.getItem("hasEntered");
    if (hasEntered) {
      setShowLanding(false);
    }

    startAutoRefresh();
  }, []);

  // Sync state with userData when it loads
  useEffect(() => {
    if (userData) {
      if (userData.selectedCountry) {
        setSelectedCountry(userData.selectedCountry as CountryId);
      }
    }
  }, [userData]);

  const isAdminPath = location.pathname === "/admin";

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

  // Automatically show onboarding if required after auth is ready
  useEffect(() => {
    if (!showLanding && !showOnboarding && !onboardingFinishedSesssion && userData && !userData.hasSeenOnboarding && !isAdminPath) {
      console.log("[App] User needs onboarding, showing modal.");
      setShowOnboarding(true);
    }
  }, [userData, showLanding, showOnboarding, onboardingFinishedSesssion, isAdminPath]);

  // Track activity
  useActivityLogger();

  const handleEnter = () => {
    setShowLanding(false);
    sessionStorage.setItem("hasEntered", "true");
  };

  const handleOnboardingComplete = () => {
    console.log("[App] Onboarding slides complete.");
    setShowOnboarding(false);
    setOnboardingFinishedSession(true); // Prevent re-triggering
    updateUserData({
      hasSeenOnboarding: true,
      selectedCountry: 'india' // Default to India as requested
    });

    // Skip Country Selection per user request - go straight to Trader Type
    if (!userData?.traderType) {
      setShowTraderTypeSelection(true);
    } else {
      window.dispatchEvent(new CustomEvent("onboardingComplete"));
    }
  };

  const handleCountrySelect = (countryId: CountryId) => {
    setSelectedCountry(countryId);
    updateUserData({ selectedCountry: countryId });
    setShowCountrySelection(false);

    // After country, check if trader type is needed
    if (!userData?.traderType) {
      setShowTraderTypeSelection(true);
    } else {
      window.dispatchEvent(new CustomEvent("onboardingComplete"));
    }
  };

  const handleTraderTypeSelect = (type: TraderType) => {
    updateUserData({ traderType: type });
    setShowTraderTypeSelection(false);
    window.dispatchEvent(new CustomEvent("onboardingComplete"));
  };

  const handleCountryChange = (countryId: CountryId) => {
    setSelectedCountry(countryId);
    updateUserData({ selectedCountry: countryId });
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
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 flex flex-col">
      <OnboardingModal
        isOpen={showOnboarding}
        onOpenChange={setShowOnboarding}
        onComplete={handleOnboardingComplete}
      />
      {/* Disclaimer only shows when initial onboarding steps are done AND not in bypass mode */}
      {!FEATURE_FLAGS.BYPASS_LOGIN && (userData?.hasSeenOnboarding || onboardingFinishedSesssion) && userData?.traderType && (
        <DisclaimerModal />
      )}
      <TraderTypeModal
        isOpen={showTraderTypeSelection}
        onSelect={handleTraderTypeSelect}
      />
      {!isLoginPage && <Navbar selectedCountry={selectedCountry} onCountryChange={handleCountryChange} />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/stocks" element={<ProtectedRoute><StockAnalysis /></ProtectedRoute>} />
        <Route path="/sectors" element={<ProtectedRoute><Sectors /></ProtectedRoute>} />
        <Route path="/multibagger" element={<ProtectedRoute><Multibagger /></ProtectedRoute>} />
        <Route path="/screeners" element={<ProtectedRoute><Screeners /></ProtectedRoute>} />
        <Route path="/screeners/near-resistance" element={<ProtectedRoute><NearResistance /></ProtectedRoute>} />
        <Route path="/screeners/support-reversal" element={<ProtectedRoute><SupportReversal /></ProtectedRoute>} />
        <Route path="/screeners/reaction-zone" element={<ProtectedRoute><ReactionZone /></ProtectedRoute>} />
        <Route path="/screeners/intraday-breakout" element={<ProtectedRoute><IntradayBreakout /></ProtectedRoute>} />
        <Route path="/backtests" element={<ProtectedRoute><Backtests /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
        <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!isLoginPage && <Footer />}
      {!isLoginPage && <AIChatbot />}
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
          <AuthProvider>
            <AppContent />
          </AuthProvider>
          <Analytics />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
