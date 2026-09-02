import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { StickyFooter } from "@/components/layout/StickyFooter";
import { AIChatbot } from "@/components/AIChatbot";
import { Analytics } from "@vercel/analytics/react";
import Dashboard from "@/pages/Dashboard";
import StockAnalysis from "@/pages/StockAnalysis";
import Sectors from "@/pages/Sectors";
import Multibagger from "@/pages/Multibagger";
import { FEATURE_FLAGS } from "@/lib/featureFlags";
//screeners 
import Screeners from "@/pages/Screeners";
import NearResistance from "@/pages/NearResistance";
import SupportReversal from "@/pages/SupportReversal";
import ReactionZone from "@/pages/ReactionZone";
import IntradayBreakout from "@/pages/IntradayBreakout";
import IntradayBreakoutScanner from "@/pages/IntradayBreakoutScanner";
import IntradayReversal from "@/pages/IntradayReversal";
import IntradayDev from "@/pages/IntradayDev";
import BreakoutBoardV1 from "@/pages/BreakoutBoardV1";
import NewBreakouts from "@/pages/NewBreakouts";
import ObvAccumulation from "@/pages/ObvAccumulation";
import NiftyAnalysis from "@/pages/NiftyAnalysis";
import ExitTargetScreener from "@/pages/ExitTargetScreener";
import WeeklyRecommendationScreener from "@/pages/WeeklyRecommendationScreener";
import Nifty50 from "@/pages/Nifty50";
import DailyNews from "@/pages/DailyNews";
import Backtests from "@/pages/Backtests";
import Admin from "@/pages/Admin";
import Help from "@/pages/Help";
import Pricing from "@/pages/Pricing";
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
import { ProfileSetupModal } from "@/components/auth/ProfileSetupModal";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationPromptBanner } from "@/components/layout/NotificationPromptBanner";

const queryClient = new QueryClient();

const AppContent = () => {
  useNotifications(); // Mount notification listener globally across app
  const [showLanding, setShowLanding] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showCountrySelection, setShowCountrySelection] = useState(false);
  const [showTraderTypeSelection, setShowTraderTypeSelection] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [slidesFinishedSession, setSlidesFinishedSession] = useState(false);
  const [traderTypeFinishedSession, setTraderTypeFinishedSession] = useState(false);
  const [profileSetupFinishedSession, setProfileSetupFinishedSession] = useState(false);
  const { userData, updateUserData, user, loading: authLoading } = useAuth();
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

  // Automatically show onboarding steps sequentially if required after auth is ready
  useEffect(() => {
    // Only trigger if we've bypassed or finished the landing page, not on admin/login path, and have userData
    if (!showLanding && !isAdminPath && !isLoginPage && userData) {
      // 1. Check for Onboarding Slides
      if (!userData.hasSeenOnboarding && !showOnboarding && !slidesFinishedSession) {
        setShowOnboarding(true);
      }
      // 2. Check for Trader Type (only if onboarding slides are done)
      else if (FEATURE_FLAGS.ENABLE_TRADER_TYPE_ONBOARDING && (userData.hasSeenOnboarding || slidesFinishedSession) && !userData.traderType && !showTraderTypeSelection && !traderTypeFinishedSession) {
        setShowTraderTypeSelection(true);
      }
      // 3. Check for Profile Setup - Name & Checkbox (only after trader type OR if trader type skipped)
      else if (((!FEATURE_FLAGS.ENABLE_TRADER_TYPE_ONBOARDING || (userData.traderType || traderTypeFinishedSession)) && (userData.hasSeenOnboarding || slidesFinishedSession)) && !userData.hasCompletedProfile && !showProfileSetup && !profileSetupFinishedSession) {
        setShowProfileSetup(true);
      }
    }
  }, [userData, showLanding, showOnboarding, slidesFinishedSession, isAdminPath, showTraderTypeSelection, showProfileSetup, traderTypeFinishedSession, profileSetupFinishedSession]);

  // Track activity
  useActivityLogger();

  const handleEnter = () => {
    setShowLanding(false);
    sessionStorage.setItem("hasEntered", "true");
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setSlidesFinishedSession(true); // Prevent re-triggering in same session
    updateUserData({
      hasSeenOnboarding: true,
    });
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
    setShowTraderTypeSelection(false);
    setTraderTypeFinishedSession(true);
    updateUserData({ traderType: type });
  };

  const handleProfileSetupComplete = (userName: string) => {
    setShowProfileSetup(false);
    setProfileSetupFinishedSession(true);
    updateUserData({
      name: userName,
      hasCompletedProfile: true
    });
  };

  const handleCountryChange = (countryId: CountryId) => {
    setSelectedCountry(countryId);
    updateUserData({ selectedCountry: countryId });
  };

  // Determine if the main app content should be visible
  // We show main content if:
  // 1. It's the login page
  // 2. User is fully onboarded
  // 3. User is NOT logged in (to allow ProtectedRoute to redirect to /login)
  const isFullyOnboarded = !!(userData?.disclaimerAcceptedAt || FEATURE_FLAGS.BYPASS_LOGIN || !FEATURE_FLAGS.ENABLE_LEGAL_DISCLAIMER);
  const showMainContent = isLoginPage || isFullyOnboarded || !user;

  // Navbar visibility: ONLY show if fully onboarded (or logged out and not on login page)
  const shouldShowNavbar = !isLoginPage && (isFullyOnboarded || !user);

  if (showLanding) {
    return (
      <>
        <NotificationPromptBanner />
        <LandingPage onEnter={handleEnter} />
      </>
    );
  }

  // Show splash screen if live data is still loading OR auth is still loading
  // OR if we are logged in but don't have userData yet (still fetching from Firestore)
  if (isLoading || loadingProgress < 100 || authLoading || (user && !userData)) {
    return <SplashScreen progress={loadingProgress} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 flex flex-col pb-16">
      <NotificationPromptBanner />
      <OnboardingModal
        isOpen={showOnboarding}
        onOpenChange={setShowOnboarding}
        onComplete={handleOnboardingComplete}
      />

      {FEATURE_FLAGS.ENABLE_LEGAL_DISCLAIMER && !FEATURE_FLAGS.BYPASS_LOGIN && <DisclaimerModal />}

      <TraderTypeModal
        isOpen={showTraderTypeSelection}
        onSelect={handleTraderTypeSelect}
      />

      <ProfileSetupModal
        isOpen={showProfileSetup}
        onComplete={handleProfileSetupComplete}
      />

      {showMainContent ? (
        <>
          {shouldShowNavbar && <Navbar selectedCountry={selectedCountry} onCountryChange={handleCountryChange} />}
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/stocks" element={<ProtectedRoute><StockAnalysis /></ProtectedRoute>} />
            <Route path="/sectors" element={<ProtectedRoute><Sectors /></ProtectedRoute>} />
            <Route path="/multibagger" element={<ProtectedRoute><Multibagger /></ProtectedRoute>} />
            <Route path="/screeners" element={<ProtectedRoute><Screeners /></ProtectedRoute>} />
            <Route path="/screeners/near-resistance" element={FEATURE_FLAGS.ENABLE_BREAKOUT_SCREENER ? <ProtectedRoute><NearResistance /></ProtectedRoute> : <Navigate to="/screeners" replace />} />
            <Route path="/screeners/support-reversal" element={FEATURE_FLAGS.ENABLE_REVERSAL_SCREENER ? <ProtectedRoute><SupportReversal /></ProtectedRoute> : <Navigate to="/screeners" replace />} />
            <Route path="/screeners/reaction-zone" element={FEATURE_FLAGS.ENABLE_REACTION_ZONE_SCREENER ? <ProtectedRoute><ReactionZone /></ProtectedRoute> : <Navigate to="/screeners" replace />} />
            <Route path="/screeners/intraday-breakout" element={<ProtectedRoute><IntradayBreakout /></ProtectedRoute>} />
            <Route path="/screeners/intraday-breakout-scanner" element={<ProtectedRoute><IntradayBreakoutScanner /></ProtectedRoute>} />
            <Route path="/screeners/intraday-reversal" element={<ProtectedRoute><IntradayReversal /></ProtectedRoute>} />
            <Route path="/screeners/nifty-analysis" element={<ProtectedRoute><NiftyAnalysis /></ProtectedRoute>} />
            <Route path="/screeners/intraday-dev" element={<ProtectedRoute><IntradayDev /></ProtectedRoute>} />
            <Route path="/screeners/breakout-v1" element={<ProtectedRoute><BreakoutBoardV1 /></ProtectedRoute>} />
            <Route path="/screeners/new-breakouts" element={<ProtectedRoute><NewBreakouts /></ProtectedRoute>} />
            <Route path="/screeners/obv-accumulation" element={<ProtectedRoute><ObvAccumulation /></ProtectedRoute>} />
            <Route path="/screeners/recommendations" element={<ProtectedRoute><ExitTargetScreener /></ProtectedRoute>} />
            <Route path="/screeners/weekly-recommendations" element={<ProtectedRoute><WeeklyRecommendationScreener /></ProtectedRoute>} />
            <Route path="/screeners/weekly-recommendation" element={<Navigate to="/screeners/weekly-recommendations" replace />} />
            <Route path="/screeners/exit-target" element={<Navigate to="/screeners/recommendations" replace />} />
            <Route path="/nifty50" element={<ProtectedRoute><Nifty50 /></ProtectedRoute>} />
            <Route path="/daily-news" element={<ProtectedRoute><DailyNews /></ProtectedRoute>} />
            <Route path="/backtests" element={<ProtectedRoute><Backtests /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
            <Route path="/pricing" element={<ProtectedRoute><Pricing /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          {!isLoginPage && <Footer />}
          {!isLoginPage && <StickyFooter />}
          {!isLoginPage && <AIChatbot />}
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-black">
          {/* Dashboard is hidden during onboarding stage */}
          <div className="max-w-md w-full p-8 text-center space-y-4">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-white/5 rounded w-3/4 mx-auto"></div>
              <div className="h-4 bg-white/5 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
