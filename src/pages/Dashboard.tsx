import { useState, useEffect, useMemo } from "react";
import { Landmark, Factory, ShoppingBag, HardHat, TrendingUp, TrendingDown, Minus, Boxes, Sparkles, AlertTriangle, BarChart3, PlayCircle, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { InfoModal, InfoModalTrigger, useInfoModal } from "@/components/ui/InfoModal";
import MarketStrengthMeter from "@/components/charts/MarketStrengthMeter";
import MLStrengthMeter from "@/components/charts/MLStrengthMeter";
import MarketBalanceIndicator from "@/components/charts/MarketBalanceIndicator";

import SentimentPieChart from "@/components/charts/SentimentPieChart";
import SentimentTrendChart from "@/components/charts/SentimentTrendChart";
import MarketPositionStructure from "@/components/charts/MarketPositionStructure";
import SectorCard from "@/components/cards/SectorCard";
import IndicesPerformance from "@/components/cards/IndicesPerformance";
import Walkthrough from "@/pages/Walkthrough";
import { GlassCard } from "@/components/ui/GlassCard";
import { PremiumProtector } from "@/components/ui/PremiumProtector";
import { indexSectorData } from "@/data/stockData";
import { Spotlight } from "@/components/ui/spotlight";
import marketMoodData from "@/data/processed/market_mood.json";
import marketStrengthData from "@/data/processed/market_strength.json";
import { useTopMovers, useLiveData } from "@/hooks/useLiveData";
import {
  getMarketMoodDescription,
  getMarketStrengthDescription,
  getMLStrengthDescription,
  getOverallSentimentDescription,
  getMarketBalanceDescription
} from "@/lib/market-analysis";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Rocket, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const MarketDescription = ({ text }: { text: string }) => (
  <p className="mt-4 text-sm text-muted-foreground/90 leading-relaxed animate-fade-in border-t border-white/5 pt-4 group-hover:text-foreground transition-colors duration-500 font-medium">
    {text.split('**').map((part, i) => i % 2 === 1 ? <strong key={i} className="text-foreground font-semibold">{part}</strong> : part)}
  </p>
);

const Dashboard = () => {
  const isMobile = useIsMobile();
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);
  const { topMovers } = useTopMovers();
  const { marketStrength: liveMarketStrength, marketMood: liveMarketMood } = useLiveData();
  const { showModal: showMarketMoodModal, openModal: openMarketMoodModal, closeModal: closeMarketMoodModal } = useInfoModal();
  const [showExpVideo, setShowExpVideo] = useState(false);
  const [showExpVideoHindi, setShowExpVideoHindi] = useState(false);

  useEffect(() => {
    const checkDisclaimer = () => {
      const disclaimerAccepted = sessionStorage.getItem('disclaimerAccepted');
      const hasSeenOnboarding = sessionStorage.getItem("hasSeenOnboarding");

      // Only show disclaimer if NOT accepted and HAS seen onboarding
      if (!disclaimerAccepted && hasSeenOnboarding) {
        setShowDisclaimer(true);
      }
    };

    checkDisclaimer();

    // Listen for the event from App.tsx
    window.addEventListener("onboardingComplete", checkDisclaimer);
    return () => window.removeEventListener("onboardingComplete", checkDisclaimer);
  }, []);

  const handleAcceptDisclaimer = () => {
    sessionStorage.setItem('disclaimerAccepted', 'true');
    setShowDisclaimer(false);
  };

  const indexStocks = indexSectorData.INDEX || [];

  const indexConfig = {
    name: "INDEX",
    icon: <BarChart3 className="w-5 h-5 text-chart-primary" />,
    color: "hsl(190, 95%, 50%)"
  };

  const moodData = liveMarketMood || marketMoodData;
  const moodVerdict = moodData.bullish > moodData.bearish ? "BULLISH" : moodData.bearish > moodData.bullish ? "BEARISH" : "NEUTRAL";
  const moodColor = moodVerdict === "BULLISH" ? "text-success" : moodVerdict === "BEARISH" ? "text-destructive" : "text-warning";
  const sentimentScore = (moodData.bullish - moodData.bearish + 100) / 2;

  // Always show current date
  const getCurrentDate = () => {
    const now = new Date();
    const day = now.getDate();
    const month = now.toLocaleDateString('en-US', { month: 'short' });
    const year = now.getFullYear();

    // Add ordinal suffix (st, nd, rd, th)
    const suffix = day === 1 || day === 21 || day === 31 ? 'st'
      : day === 2 || day === 22 ? 'nd'
        : day === 3 || day === 23 ? 'rd'
          : 'th';

    return `${day}${suffix} ${month} ${year}`;
  };

  const latestUpdateDate = getCurrentDate();

  // Mobile optimization for charts
  const chartDataLimit = isMobile ? 22 : undefined; // Show last 22 data points on mobile (approx 1 month)

  const displayStrengthData = useMemo(() => {
    const data = liveMarketStrength.length > 0 ? liveMarketStrength : marketStrengthData;
    if (chartDataLimit && data.length > chartDataLimit) {
      return data.slice(-chartDataLimit);
    }
    return data;
  }, [liveMarketStrength, marketStrengthData, chartDataLimit]);

  const displayMoodTrend = useMemo(() => {
    const data = moodData.trend || [];
    if (chartDataLimit && data.length > chartDataLimit) {
      return data.slice(-chartDataLimit);
    }
    return data;
  }, [moodData.trend, chartDataLimit]);

  // EOD date from Swing Sheet (for EOD components)
  const eodDate = liveMarketStrength.length > 0
    ? liveMarketStrength[liveMarketStrength.length - 1].date
    : null;

  return (
    <div className="bg-background selection:bg-primary/30 overflow-x-hidden w-full h-full flex-grow">
      {/* SEBI Disclaimer Modal */}
      <Dialog open={showDisclaimer} onOpenChange={setShowDisclaimer}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-warning/10">
                <AlertTriangle className="w-6 h-6 text-warning" />
              </div>
              <DialogTitle className="text-xl font-bold">Important Disclaimer</DialogTitle>
            </div>
            <DialogDescription className="text-base leading-relaxed pt-4">
              The information provided on this platform is for analytical and educational purposes only and should not be construed as investment advice, stock recommendations, or portfolio management services as defined by SEBI.
            </DialogDescription>
            <DialogDescription className="text-base leading-relaxed pt-2">
              Users are solely responsible for their trading and investment decisions. Past performance and historical analysis do not guarantee future results.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button onClick={handleAcceptDisclaimer} className="w-full sm:w-auto">
              I Understand & Accept
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Premium background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px] animate-pulse delay-700" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-secondary/10 rounded-full blur-[100px] animate-pulse delay-1000" />
      </div>

      <div className="relative container mx-auto px-4 pt-12 pb-0 lg:pt-16 lg:pb-0">
        <Spotlight className="-top-40 left-0 opacity-50" />

        {/* Header Section */}
        <div className="relative z-[100] mb-16 animate-fade-in px-2 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider animate-fade-in">
              <Sparkles className="w-3 h-3" />
              Decision Support Analytics Platform
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-none">
                Market <span className="gradient-text italic pr-2">Overview</span>
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowExpVideo(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 hover:border-primary/40 transition-all duration-200 group whitespace-nowrap"
                  title="Watch Explainer Video"
                >
                  <PlayCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  <span className="text-[10px] sm:text-xs font-bold text-primary/90 transition-colors uppercase tracking-wider">Explainer video</span>
                </button>
                <button
                  onClick={() => setShowExpVideoHindi(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 hover:border-orange-500/40 transition-all duration-200 group whitespace-nowrap"
                  title="हिंदी में देखें"
                >
                  <PlayCircle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
                  <span className="text-[10px] sm:text-xs font-bold text-orange-400/90 transition-colors uppercase tracking-wider">हिंदी Video</span>
                </button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-2xl font-medium leading-relaxed">
              Precision analytics and real-time indicators for professional market monitoring.
            </p>
          </div>
          <div className="flex flex-col items-end gap-3 relative z-[100]">
            {/* Walkthrough Dropdown Trigger */}
            <div className="relative">
              <button
                onClick={() => setIsWatchlistOpen(!isWatchlistOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-primary/20 bg-primary/10 hover:bg-primary/20 transition-colors text-primary font-medium shadow-[0_0_15px_rgba(var(--primary),0.3)] backdrop-blur-md"
              >
                <Rocket className="w-4 h-4" />
                <span className="text-sm font-bold tracking-wider uppercase">Watchlist</span>
                <ChevronDown className={`w-4 h-4 opacity-70 transition-transform ${isWatchlistOpen ? 'rotate-180' : ''}`} />
              </button>

              <div className={`fixed sm:absolute top-[200px] sm:top-[calc(100%+12px)] left-4 right-4 sm:left-auto sm:right-0 w-auto sm:w-[600px] md:w-[800px] lg:w-[1050px] xl:w-[1250px] max-w-none sm:max-w-[92vw] lg:max-w-[90vw] max-h-[70vh] sm:max-h-[85vh] overflow-y-auto overflow-x-hidden bg-[#0f172a]/95 backdrop-blur-xl border border-primary/20 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.8)] transition-all duration-300 custom-scrollbar z-[300] ${isWatchlistOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'
                }`}>
                <div className="p-0">
                  <Walkthrough isInDropdown={true} />
                </div>
              </div>
            </div>

            <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md relative z-10 text-center min-w-[150px]">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Latest Update</p>
              <p className="text-sm font-mono font-medium text-foreground">{latestUpdateDate}</p>
            </div>
          </div>
        </div>

        {/* Market Indicators Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
          {/* Market Mood Today */}
          <GlassCard delay={0.1} className="flex flex-col h-full">
            <div className="h-full flex flex-col">
              <div className="flex justify-between items-center mb-10">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-foreground/80">
                    Market Mood Today <span className="text-primary/80">(LIVE DATA)</span>
                  </h3>
                  <p className="text-xs text-muted-foreground/60 font-medium italic">
                    Current internal dynamics - refer the market overall Market Position Structure for the upcoming weeks
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <InfoModalTrigger onClick={openMarketMoodModal} />
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center">
                <div className="grid grid-cols-3 gap-6">
                  <div className="group/item relative p-6 rounded-2xl bg-success/5 border border-success/10 transition-all duration-500 hover:bg-success/10 hover:border-success/20">
                    <TrendingUp className="w-5 h-5 text-success mb-4 opacity-70 group-hover/item:opacity-100 transition-opacity" />
                    <span className="text-2xl md:text-3xl font-bold text-success tracking-tight">{Math.round(moodData.bullish)}%</span>
                    <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wide mt-2">Positive Bias</p>
                  </div>
                  <div className="group/item relative p-6 rounded-2xl bg-destructive/5 border border-destructive/10 transition-all duration-500 hover:bg-destructive/10 hover:border-destructive/20">
                    <TrendingDown className="w-5 h-5 text-destructive mb-4 opacity-70 group-hover/item:opacity-100 transition-opacity" />
                    <span className="text-2xl md:text-3xl font-bold text-destructive tracking-tight">{Math.round(moodData.bearish)}%</span>
                    <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wide mt-2">Negative Bias</p>
                  </div>
                  <div className="group/item relative p-6 rounded-2xl bg-warning/5 border border-warning/10 transition-all duration-500 hover:bg-warning/10 hover:border-warning/20">
                    <Minus className="w-5 h-5 text-warning mb-4 opacity-70 group-hover/item:opacity-100 transition-opacity" />
                    <span className="text-2xl md:text-3xl font-bold text-warning tracking-tight">{Math.round(moodData.neutral)}%</span>
                    <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wide mt-2">Neutral</p>
                  </div>


                </div>
                <SentimentTrendChart data={displayMoodTrend} />

                <p className="text-[10px] text-muted-foreground/60 text-center mt-4 leading-relaxed font-medium italic max-w-[80%] mx-auto">
                  Please note Percentages represent distribution of observed conditions, not probability or forecast.
                </p>
              </div>

              {/* Top Movers Section */}
              {topMovers && (topMovers.topGainers?.length > 0 || topMovers.topLosers?.length > 0) && (
                <div className="mt-8 pt-6 border-t border-white/5">
                  <h4 className="text-xs font-bold uppercase tracking-wide text-foreground/80 mb-4">
                    Market Mood <span className="text-primary/80">(LIVE DATA)</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Top Gainers */}
                    <div className="rounded-xl bg-success/5 border border-success/10 p-3">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-success" />
                        <span className="text-xs font-semibold text-success uppercase tracking-wide">Top 10 Gainers</span>
                      </div>
                      <div className="overflow-hidden">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-muted-foreground/60">
                              <th className="text-left font-medium pb-2">ID</th>
                              <th className="text-right font-medium pb-2">Change%</th>
                              <th className="text-right font-medium pb-2">Close</th>
                            </tr>
                          </thead>
                          <tbody>
                            {topMovers?.topGainers?.map((stock, i) => (
                              <tr key={stock.id} className="border-t border-white/5 hover:bg-success/5 transition-colors">
                                <td className="py-1.5 font-medium text-foreground/90">{stock.id}</td>
                                <td className="py-1.5 text-right font-semibold text-success">+{(stock.changePercent * 100).toFixed(2)}%</td>
                                <td className="py-1.5 text-right text-muted-foreground">{stock.closePrice.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Top Losers */}
                    <div className="rounded-xl bg-destructive/5 border border-destructive/10 p-3">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingDown className="w-4 h-4 text-destructive" />
                        <span className="text-xs font-semibold text-destructive uppercase tracking-wide">Top 10 Losers</span>
                      </div>
                      <div className="overflow-hidden">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-muted-foreground/60">
                              <th className="text-left font-medium pb-2">ID</th>
                              <th className="text-right font-medium pb-2">Change%</th>
                              <th className="text-right font-medium pb-2">Close</th>
                            </tr>
                          </thead>
                          <tbody>
                            {topMovers?.topLosers?.map((stock, i) => (
                              <tr key={stock.id} className="border-t border-white/5 hover:bg-destructive/5 transition-colors">
                                <td className="py-1.5 font-medium text-foreground/90">{stock.id}</td>
                                <td className="py-1.5 text-right font-semibold text-destructive">{(stock.changePercent * 100).toFixed(2)}%</td>
                                <td className="py-1.5 text-right text-muted-foreground">{stock.closePrice.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <MarketDescription text={getMarketMoodDescription(moodData, topMovers)} />

              <InfoModal
                isOpen={showMarketMoodModal}
                onClose={closeMarketMoodModal}
                title="Understanding Market Mood Today"
                sections={[
                  {
                    heading: "What is Market Mood?",
                    content: "Market Mood Today captures the current internal dynamics of the market by analyzing the relative strength of all stocks. It shows the percentage distribution of stocks that are bullish, bearish, or neutral based on their internal strength patterns."
                  },
                  {
                    heading: "Bullish Percentage",
                    content: "Represents the percentage of stocks showing internal bullish strength. A higher bullish percentage indicates more stocks are positioned for potential upside moves based on their technical positioning."
                  },
                  {
                    heading: "Bearish Percentage",
                    content: "Represents the percentage of stocks showing internal bearish weakness. A higher bearish percentage suggests more stocks are under pressure and positioned for potential downside."
                  },
                  {
                    heading: "Neutral Percentage",
                    content: "Represents stocks that are neither showing strong bullish nor bearish signals. These stocks are in a consolidation phase, waiting for a directional trigger."
                  },
                  {
                    heading: "How to Interpret",
                    content: "When bullish exceeds bearish significantly, the market mood is positive and favorable for long positions. When bearish exceeds bullish, caution is advised. Use this alongside other indicators for comprehensive market analysis."
                  }
                ]}
                videoLink="#"
              />
            </div>
          </GlassCard>

          {/* Market Position Structure */}
          <GlassCard delay={0.2} className="flex flex-col h-full">
            <div className="h-full flex flex-col">
              <MarketPositionStructure eodDate={eodDate} />
            </div>
          </GlassCard>

          {/* ML Strength Meter */}
          <GlassCard delay={0.3} className="flex flex-col h-full">
            <PremiumProtector requiredTier="pro">
              <div className="h-full flex flex-col p-4">
                <MLStrengthMeter data={displayStrengthData} eodDate={eodDate} />
              </div>
            </PremiumProtector>
          </GlassCard>

          {/* Market Strength Meter (Momentum Oscillator) */}
          <GlassCard delay={0.4} className="flex flex-col h-full">
            <PremiumProtector requiredTier="pro">
              <div className="h-full flex flex-col p-4">
                <MarketStrengthMeter data={displayStrengthData} eodDate={eodDate} />
                <MarketDescription text={getMarketStrengthDescription(displayStrengthData)} />
              </div>
            </PremiumProtector>
          </GlassCard>

          {/* Market Balance Indicator - Full Width */}
          <GlassCard delay={0.5} className="flex flex-col h-full md:col-span-2">
            <PremiumProtector requiredTier="pro">
              <div className="h-full flex flex-col p-4">
                <MarketBalanceIndicator data={displayStrengthData} eodDate={eodDate} />
              </div>
            </PremiumProtector>
          </GlassCard>
        </div>

        {/* Index Section */}
        <div className="mb-0">
          <div className="animate-fade-in-up space-y-3 mb-6">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              Index <span className="gradient-text italic pr-2">Performance</span>
              <span className="text-sm font-semibold text-primary/80 ml-2">(LIVE DATA)</span>
            </h2>
            <p className="text-sm text-muted-foreground max-w-2xl font-medium">Sector strength analysis with weakness/strength indicators. Click any index to view stocks.</p>
          </div>

          <GlassCard delay={0.5}>
            <IndicesPerformance />
          </GlassCard>
        </div>

      </div>
      {/* Dashboard Explainer Video Modal */}
      {showExpVideo && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => setShowExpVideo(false)}
        >
          <div
            className="relative w-full max-w-4xl bg-background/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-muted/30">
              <div className="flex items-center gap-3 font-semibold text-foreground">
                <PlayCircle className="w-5 h-5 text-primary" />
                <span>Dashboard Explainer Video</span>
              </div>
              <button
                onClick={() => setShowExpVideo(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-video w-full bg-black flex items-center justify-center">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/OhyQgntUPIU?autoplay=1"
                title="Dashboard Explainer Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            </div>

            <div className="p-4 bg-muted/20 border-t border-white/10">
              <p className="text-xs text-muted-foreground text-center font-medium italic">
                Get a quick overview of our proprietary dashboard analytics, market mood indicators, and precision screeners.
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Dashboard Hindi Explainer Video Modal */}
      {showExpVideoHindi && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => setShowExpVideoHindi(false)}
        >
          <div
            className="relative w-full max-w-4xl bg-background/95 backdrop-blur-xl border border-orange-500/20 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-muted/30">
              <div className="flex items-center gap-3 font-semibold text-foreground">
                <PlayCircle className="w-5 h-5 text-orange-400" />
                <span>Dashboard Explainer — हिंदी में</span>
              </div>
              <button
                onClick={() => setShowExpVideoHindi(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video w-full bg-black flex items-center justify-center">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/o-MfbZz0sEQ?autoplay=1"
                title="Dashboard Explainer Video Hindi"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            </div>
            <div className="p-4 bg-orange-500/5 border-t border-white/10">
              <p className="text-xs text-muted-foreground text-center font-medium italic">
                हमारे डैशबोर्ड को हिंदी में समझें — मार्केट मूड, इंडिकेटर और स्क्रीनर।
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;



