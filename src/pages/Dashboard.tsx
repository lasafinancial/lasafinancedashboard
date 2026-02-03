import { useState, useEffect } from "react";
import { Landmark, Factory, ShoppingBag, HardHat, TrendingUp, TrendingDown, Minus, Boxes, Sparkles, AlertTriangle, BarChart3 } from "lucide-react";
import { InfoModal, InfoModalTrigger, useInfoModal } from "@/components/ui/InfoModal";
import MarketStrengthMeter from "@/components/charts/MarketStrengthMeter";
import MLStrengthMeter from "@/components/charts/MLStrengthMeter";
import MarketBalanceIndicator from "@/components/charts/MarketBalanceIndicator";

import SentimentPieChart from "@/components/charts/SentimentPieChart";
import MarketPositionStructure from "@/components/charts/MarketPositionStructure";
import SectorCard from "@/components/cards/SectorCard";
import IndicesPerformance from "@/components/cards/IndicesPerformance";
import { GlassCard } from "@/components/ui/GlassCard";
import { indexSectorData } from "@/data/stockData";
import { InteractiveHero } from "@/components/ui/interactive-hero";
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
import { Button } from "@/components/ui/button";

const MarketDescription = ({ text }: { text: string }) => (
  <p className="mt-4 text-sm text-muted-foreground/90 leading-relaxed animate-fade-in border-t border-white/5 pt-4 group-hover:text-foreground transition-colors duration-500 font-medium">
    {text.split('**').map((part, i) => i % 2 === 1 ? <strong key={i} className="text-foreground font-semibold">{part}</strong> : part)}
  </p>
);

const Dashboard = () => {
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const { topMovers } = useTopMovers();
  const { marketStrength: liveMarketStrength, marketMood: liveMarketMood } = useLiveData();
  const { showModal: showMarketMoodModal, openModal: openMarketMoodModal, closeModal: closeMarketMoodModal } = useInfoModal();
  
  useEffect(() => {
    const disclaimerAccepted = sessionStorage.getItem('disclaimerAccepted');
    if (!disclaimerAccepted) {
      setShowDisclaimer(true);
    }
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

  const latestUpdateDate = liveMarketStrength.length > 0 
    ? liveMarketStrength[liveMarketStrength.length - 1].date 
    : (moodData?.date || marketMoodData.date);

  // EOD date from Swing Sheet (for EOD components)
  const eodDate = liveMarketStrength.length > 0 
    ? liveMarketStrength[liveMarketStrength.length - 1].date 
    : null;

  return (
    <div className="min-h-screen bg-background selection:bg-primary/30 overflow-x-hidden">
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
        <div className="mb-16 animate-fade-in px-2 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider animate-fade-in">
                  <Sparkles className="w-3 h-3" />
                  Decision Support Analytics Platform
                </div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-none">
                      Market <span className="gradient-text italic pr-2">Overview</span>
                    </h1>
              <p className="text-sm text-muted-foreground max-w-2xl font-medium leading-relaxed">
                Precision analytics and real-time indicators for professional market monitoring.
              </p>
            </div>
          <div className="flex flex-col items-end">
              <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
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
<h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Market Mood Today <span className="text-primary/80">(LIVE DATA)</span>
                            </h3>
                            <p className="text-xs text-muted-foreground/60 font-medium italic">Current internal dynamics</p>
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
                        <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wide mt-2">Bullish</p>
                      </div>
                      <div className="group/item relative p-6 rounded-2xl bg-destructive/5 border border-destructive/10 transition-all duration-500 hover:bg-destructive/10 hover:border-destructive/20">
                        <TrendingDown className="w-5 h-5 text-destructive mb-4 opacity-70 group-hover/item:opacity-100 transition-opacity" />
                        <span className="text-2xl md:text-3xl font-bold text-destructive tracking-tight">{Math.round(moodData.bearish)}%</span>
                        <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wide mt-2">Bearish</p>
                      </div>
                      <div className="group/item relative p-6 rounded-2xl bg-warning/5 border border-warning/10 transition-all duration-500 hover:bg-warning/10 hover:border-warning/20">
                        <Minus className="w-5 h-5 text-warning mb-4 opacity-70 group-hover/item:opacity-100 transition-opacity" />
                        <span className="text-2xl md:text-3xl font-bold text-warning tracking-tight">{Math.round(moodData.neutral)}%</span>
                        <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wide mt-2">Neutral</p>
                      </div>

                  </div>
                  <p className="text-xs text-muted-foreground/40 text-center mt-10 uppercase tracking-wider font-semibold">
                    Internal Relative Strength Analysis
                  </p>
                </div>

                {/* Top Movers Section */}
                {topMovers && (topMovers.topGainers?.length > 0 || topMovers.topLosers?.length > 0) && (
                  <div className="mt-8 pt-6 border-t border-white/5">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
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

                <MarketDescription text={getMarketMoodDescription(moodData)} />

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
              <div className="h-full flex flex-col">
                <MLStrengthMeter data={liveMarketStrength.length > 0 ? liveMarketStrength : marketStrengthData} eodDate={eodDate} />
              </div>
            </GlassCard>
          
          {/* Market Strength Meter (Momentum Oscillator) */}
          <GlassCard delay={0.4} className="flex flex-col h-full">
            <div className="h-full flex flex-col">
              <MarketStrengthMeter data={liveMarketStrength.length > 0 ? liveMarketStrength : marketStrengthData} eodDate={eodDate} />
              <MarketDescription text={getMarketStrengthDescription(liveMarketStrength.length > 0 ? liveMarketStrength : marketStrengthData)} />
            </div>
          </GlassCard>

            {/* Market Balance Indicator - Full Width */}
            <GlassCard delay={0.5} className="flex flex-col h-full md:col-span-2">
              <div className="h-full flex flex-col">
                <MarketBalanceIndicator data={liveMarketStrength.length > 0 ? liveMarketStrength : marketStrengthData} eodDate={eodDate} />
              </div>
            </GlassCard>
          </div>

            {/* Index Section */}
              <div className="mb-12">
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

        {/* Interactive Hero Section */}
        <div className="mt-12 animate-fade-in-up">
          <InteractiveHero />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;



