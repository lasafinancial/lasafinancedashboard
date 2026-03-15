import { useState } from "react";
import { ChevronRight, ChevronDown, TrendingUp, TrendingDown, Activity, BarChart3, Clock, ShieldCheck, Zap, Target, Lightbulb, AlertCircle, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { useLiveData } from "@/hooks/useLiveData";
import { useIsMobile } from "@/hooks/use-mobile";
import StockPriceChart from "@/components/charts/StockPriceChart";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ---- Reusable helpers (mirrors IndicesPerformance logic) ----
const calculatePricePosition = (price: number, lowerRange: number, upperRange: number) => {
  const actualMin = Math.min(price, lowerRange);
  const actualMax = Math.max(price, upperRange);
  const padding = (actualMax - actualMin) * 0.1;
  const displayMin = actualMin - padding;
  const displayMax = actualMax + padding;
  const displayRange = displayMax - displayMin;
  const pricePosition = displayRange > 0 ? ((price - displayMin) / displayRange) * 100 : 50;
  return { pricePosition };
};

const getDynamicStatus = (price: number, lowerRange: number, upperRange: number) => {
  const { pricePosition } = calculatePricePosition(price, lowerRange, upperRange);
  if (pricePosition > 66.66) return "BULLISH";
  if (pricePosition < 33.33) return "BEARISH";
  return "NEUTRAL";
};

// ---- Sub-components ----
const StockRangeBar = ({ price, lowerRange, upperRange }: { price: number; lowerRange: number; upperRange: number }) => {
  const { pricePosition } = calculatePricePosition(price, lowerRange, upperRange);
  return (
    <div className="mt-3 px-2">
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-bold text-destructive/80 w-8">S</span>
        <div className="flex-1 h-4 rounded-full bg-gradient-to-r from-destructive via-warning to-success relative shadow-inner overflow-hidden">
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-white shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all duration-300"
            style={{ left: `calc(${pricePosition}% - 7px)` }}
          />
        </div>
        <span className="text-[9px] font-bold text-success/80 w-8 text-right">R</span>
      </div>
      <div className="flex justify-between mt-1.5 text-[9px]">
        <span className="text-destructive/70 font-mono">₹{lowerRange?.toLocaleString()}</span>
        <span className="text-success/70 font-mono">₹{upperRange?.toLocaleString()}</span>
      </div>
    </div>
  );
};

const StockCard = ({ stock }: { stock: any }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const status = getDynamicStatus(stock.price, stock.lowerRange, stock.upperRange);
  const isBullish = status === "BULLISH";
  const isBearish = status === "BEARISH";

  const glowClass = isBullish
    ? "shadow-[0_0_15px_rgba(34,197,94,0.3)] border-success/40"
    : isBearish
      ? "shadow-[0_0_15px_rgba(239,68,68,0.3)] border-destructive/40"
      : "shadow-[0_0_12px_rgba(251,191,36,0.25)] border-warning/30";

  return (
    <div
      className={`rounded-lg bg-white/5 border transition-all duration-300 cursor-pointer ${glowClass}`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 animate-pulse ${isBullish ? "bg-success" : isBearish ? "bg-destructive" : "bg-warning"}`} />
          <span className="font-medium text-sm truncate">{stock.stockName}</span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="font-mono text-sm font-bold">₹{stock.price?.toLocaleString()}</span>
          {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>
      {isExpanded && (
        <div className="pb-3 border-t border-white/5">
          <StockRangeBar price={stock.price} lowerRange={stock.lowerRange} upperRange={stock.upperRange} />
        </div>
      )}
    </div>
  );
};

const getDirectionBadge = (direction: string) => {
  const val = (direction || '').toUpperCase();
  if (val === 'BULLISH') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 text-success text-[10px] font-bold border border-success/20">
        <TrendingUp className="h-2.5 w-2.5" />
        Bullish
      </span>
    );
  }
  if (val === 'BEARISH') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-[10px] font-bold border border-destructive/20">
        <TrendingDown className="h-2.5 w-2.5" />
        Bearish
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning/10 text-warning text-[10px] font-bold border border-warning/20">
      <Minus className="h-2.5 w-2.5" />
      Neutral
    </span>
  );
};

const getActionColor = (action: string) => {
  const val = (action || '').toUpperCase();
  if (val.includes('BUY') || val.includes('ACCUMULATE') || val.includes('LONG')) return 'text-success border-success/20 bg-success/5';
  if (val.includes('SELL') || val.includes('EXIT') || val.includes('SHORT') || val.includes('AVOID')) return 'text-destructive border-destructive/20 bg-destructive/5';
  return 'text-warning border-warning/20 bg-warning/5';
};

// ---- Main Page ----
const Nifty50 = () => {
  const { nifty50Stocks, stockData, niftyAnalysis, marketMood, isLoading } = useLiveData();
  const isMobile = useIsMobile();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAnalysisIndex, setSelectedAnalysisIndex] = useState(0);
  const [showAllScenarios, setShowAllScenarios] = useState(false);
  const [showAllActions, setShowAllActions] = useState(false);

  const history = niftyAnalysis?.history || [];
  const selectedAnalysis = history[selectedAnalysisIndex] || (niftyAnalysis?.scenarios ? niftyAnalysis : null);

  // Find NIFTY 50 data in stockData for the chart
  const niftyStockData = stockData.find(
    (s) => s.symbol?.toUpperCase() === "NIFTY 50" || s.name?.toUpperCase() === "NIFTY 50"
  );

  // Real-time Bullish / Bearish / Neutral counts from nifty50Stocks
  const dynamicStocks = nifty50Stocks.map((s: any) => ({
    ...s,
    computedStatus: getDynamicStatus(s.price, s.lowerRange, s.upperRange),
  }));
  const bullishCount = dynamicStocks.filter((s: any) => s.computedStatus === "BULLISH").length;
  const bearishCount = dynamicStocks.filter((s: any) => s.computedStatus === "BEARISH").length;
  const neutralCount = dynamicStocks.length - bullishCount - bearishCount;
  const strengthScore = dynamicStocks.length > 0 ? Math.round((bullishCount / dynamicStocks.length) * 100) : 0;

  const strengthColor =
    strengthScore >= 70 ? "bg-success" : strengthScore >= 50 ? "bg-warning" : "bg-destructive";
  const strengthTextColor = "text-success";

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 rounded-xl bg-white/5 border border-white/10 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6 max-w-7xl">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-3"
      >
        <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
          <BarChart3 className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold gradient-text uppercase">NIFTY</h1>
          <p className="text-sm text-muted-foreground uppercase tracking-tight">Live Index Performance & Analysis</p>
        </div>
      </motion.div>

      {/* Index Strength Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all duration-300 cursor-pointer"
        onClick={() => setIsDialogOpen(true)}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${strengthScore >= 50 ? "bg-success" : "bg-destructive"} animate-pulse`} />
            <h4 className="font-semibold text-sm">NIFTY 50</h4>
            <span className="text-[10px] text-muted-foreground/60 font-mono">({dynamicStocks.length} stocks)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold ${strengthTextColor}`}>{strengthScore}%</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>

        {/* Strength Gauge */}
        <div className="flex items-center gap-3 w-full">
          <span className="text-[10px] font-bold text-destructive uppercase tracking-wider w-16">Support</span>
          <div className="flex-1 h-3 rounded-full bg-gradient-to-r from-destructive/30 via-warning/30 to-success/30 relative overflow-hidden">
            <div
              className={`absolute left-0 top-0 h-full rounded-full ${strengthColor} transition-all duration-500 shadow-lg`}
              style={{ width: `${strengthScore}%` }}
            />
            <div
              className="absolute top-0 h-full w-1 bg-white/80 rounded-full shadow-md transition-all duration-500"
              style={{ left: `calc(${strengthScore}% - 2px)` }}
            />
          </div>
          <span className="text-[10px] font-bold text-success uppercase tracking-wider w-16 text-right">Resistance</span>
        </div>

        <div className="flex items-center gap-4 mt-3 text-[10px]">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-success" />
            <span className="text-success font-bold">{bullishCount} Bullish</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingDown className="w-3 h-3 text-destructive" />
            <span className="text-destructive font-bold">{bearishCount} Bearish</span>
          </div>
          <div className="flex items-center gap-1">
            <Activity className="w-3 h-3 text-warning" />
            <span className="text-warning font-bold">{neutralCount} Neutral</span>
          </div>
        </div>
      </motion.div>

      {/* Price Movement Chart */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="p-4 rounded-xl bg-white/5 border border-white/10"
      >
        <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Price Movement
          {niftyStockData?.price && (
            <span className="text-sm text-muted-foreground font-mono ml-2">
              Live: ₹{niftyStockData.price.toLocaleString()}
            </span>
          )}
        </h3>
        {niftyStockData ? (
          <StockPriceChart data={niftyStockData.history} symbol="NIFTY 50" />
        ) : (
          <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
            NIFTY 50 chart data not available. Try searching "NIFTY 50" in Stock Analysis to confirm it exists.
          </div>
        )}
      </motion.div>

      {/* Market Analysis Scenario Table Section */}
      {selectedAnalysis?.summary?.niftyClose && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="space-y-6 pt-4"
        >
          {/* Section Header & Date Selector (at the top) */}
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-2 pt-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Lightbulb className="w-5 h-5 text-warning" />
                  <h2 className="text-xl font-bold uppercase tracking-tight">Market Analysis & Probable Scenarios</h2>
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded uppercase tracking-widest">Live Data</span>
                </div>
                <p className="text-xs text-muted-foreground italic max-w-xl">
                  Scenario probabilities and technical triggers as defined in the daily algorithmic analysis.
                </p>
              </div>
            </div>


            {/* Prominent Date Switcher Buttons */}
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Analysis Date Selection:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {history.length > 0 ? (
                  history.slice(0, 10).map((h: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedAnalysisIndex(idx)}
                      className={`
                        px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 border
                        ${selectedAnalysisIndex === idx
                          ? 'bg-primary text-primary-foreground border-primary shadow-[0_0_20px_rgba(59,130,246,0.3)] scale-105'
                          : 'bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10 hover:text-foreground hover:border-white/20'
                        }
                      `}
                    >
                      {h.summary?.date || "Unknown Date"}
                      {idx === 0 && <span className="ml-1.5 text-[8px] opacity-70 uppercase tracking-tighter bg-white/10 px-1 py-0.5 rounded">Latest</span>}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-2 rounded-xl text-xs font-bold bg-primary/20 text-primary border border-primary/30">
                    {selectedAnalysis?.summary?.date || "Current Analysis"} (Latest)
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Scenario Table Section */}
          <div className="space-y-4">
            {!isMobile ? (
              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Scenario</th>
                      <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">Probability %</th>
                      <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Trigger</th>
                      <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">Nifty Target</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {selectedAnalysis.scenarios.slice(0, 5).map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors group">
                        <td className="p-4 align-top w-1/4">
                          <span className="text-sm font-bold text-foreground/90 group-hover:text-primary transition-colors">
                            {item.scenario}
                          </span>
                        </td>
                        <td className="p-4 align-top text-center w-32">
                          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-mono font-bold text-xs shadow-[0_0_10px_rgba(59,130,246,0.15)]">
                            {item.probability}
                          </span>
                        </td>
                        <td className="p-4 align-top">
                          <p className="text-xs leading-relaxed text-foreground/70">
                            {item.trigger}
                          </p>
                        </td>
                        <td className="p-4 align-top text-center w-40">
                          <span className="text-sm font-mono font-bold text-primary">
                            {item.target}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedAnalysis.scenarios.slice(0, showAllScenarios ? 5 : 3).map((item: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-2xl border border-white/10 bg-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-primary italic pr-2">{item.scenario}</span>
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-mono font-bold text-[10px]">
                        {item.probability}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Trigger Analysis</span>
                      <p className="text-xs text-foreground/70 leading-relaxed">{item.trigger}</p>
                    </div>
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Nifty Target</span>
                      <span className="text-sm font-mono font-bold text-primary">{item.target}</span>
                    </div>
                  </div>
                ))}
                {selectedAnalysis.scenarios.length > 3 && (
                  <button
                    onClick={() => setShowAllScenarios(!showAllScenarios)}
                    className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-primary hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                  >
                    {showAllScenarios ? "View Less" : `View More (${selectedAnalysis.scenarios.length - 3} more scenarios)`}
                    {showAllScenarios ? <ChevronDown className="w-4 h-4 rotate-180" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Trader Action Plan Section */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-success" />
              <h2 className="text-xl font-bold uppercase tracking-tight">Trader Action Plan</h2>
            </div>

            <div className="space-y-4">
              {!isMobile ? (
                <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5">
                        <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Trader Type</th>
                        <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">Action</th>
                        <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Details / Strategy</th>
                        <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Key Levels</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {selectedAnalysis.actionPlan.slice(0, 5).map((plan: any, idx: number) => (
                        <tr key={idx} className="hover:bg-white/5 transition-colors group">
                          <td className="p-4 align-top w-40">
                            <div className="flex items-center gap-2">
                              <Zap className="w-3.5 h-3.5 text-primary" />
                              <span className="text-sm font-bold text-foreground/90 group-hover:text-primary transition-colors">
                                {plan.traderType}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 align-top text-center w-32">
                            <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold border tracking-wide uppercase ${getActionColor(plan.action)}`}>
                              {plan.action}
                            </span>
                          </td>
                          <td className="p-4 align-top">
                            <p className="text-xs leading-relaxed text-foreground/70">
                              {plan.detail}
                            </p>
                          </td>
                          <td className="p-4 align-top w-56">
                            <p className="text-xs font-mono font-semibold text-foreground/60 leading-tight">
                              {plan.keyLevels}
                            </p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedAnalysis.actionPlan.slice(0, showAllActions ? 5 : 3).map((plan: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-2xl border border-white/10 bg-white/5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-primary" />
                          <span className="text-sm font-bold text-foreground/90">{plan.traderType}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border tracking-wider uppercase ${getActionColor(plan.action)}`}>
                          {plan.action}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Strategy</span>
                        <p className="text-xs text-foreground/70 leading-relaxed">{plan.detail}</p>
                      </div>
                      <div className="pt-3 border-t border-white/5">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Key Levels</span>
                          <p className="text-[10px] font-mono text-foreground/60 font-semibold leading-tight">{plan.keyLevels}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {selectedAnalysis.actionPlan.length > 3 && (
                    <button
                      onClick={() => setShowAllActions(!showAllActions)}
                      className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-primary hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                    >
                      {showAllActions ? "View Less" : `View More (${selectedAnalysis.actionPlan.length - 3} more plans)`}
                      {showAllActions ? <ChevronDown className="w-4 h-4 rotate-180" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Line & Key Watch Footer */}
            {(selectedAnalysis.bottomLine || selectedAnalysis.keyWatch) && (
              <div className="grid grid-cols-1 gap-6 pt-4 pb-12">
                {selectedAnalysis.bottomLine && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-8 rounded-3xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 shadow-[0_0_30px_rgba(59,130,246,0.1)] relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Activity className="w-24 h-24 text-primary" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-primary/20">
                          <ShieldCheck className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="font-black uppercase tracking-[0.2em] text-xs text-primary/80">Bottom Line Analysis</h3>
                      </div>
                      <p className="text-base leading-relaxed text-foreground/90 font-medium whitespace-pre-wrap italic decoration-primary/30">
                        {selectedAnalysis.bottomLine}
                      </p>
                    </div>
                  </motion.div>
                )}

                {selectedAnalysis.keyWatch && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-8 rounded-3xl bg-gradient-to-br from-warning/10 to-transparent border border-warning/20 relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Target className="w-24 h-24 text-warning" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-warning/20">
                          <Lightbulb className="w-5 h-5 text-warning" />
                        </div>
                        <h3 className="font-black uppercase tracking-[0.2em] text-xs text-warning/80">Key Levels to Watch</h3>
                      </div>
                      <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap font-medium">
                        {selectedAnalysis.keyWatch}
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Stock List Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              NIFTY 50
              <span className="text-sm font-normal text-muted-foreground">
                ({dynamicStocks.length} stocks)
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Real-time technical status and performance of all NIFTY 50 constituents.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-4 text-xs mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
              <span className="text-muted-foreground">Bullish ({bullishCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
              <span className="text-muted-foreground">Bearish ({bearishCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-warning shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
              <span className="text-muted-foreground">Neutral ({neutralCount})</span>
            </div>
          </div>
          <div className="overflow-y-auto max-h-[55vh] pr-2 space-y-2">
            {dynamicStocks
              .slice()
              .sort((a: any, b: any) => {
                const order: Record<string, number> = { BULLISH: 0, BEARISH: 1, NEUTRAL: 2 };
                return (order[a.computedStatus] ?? 2) - (order[b.computedStatus] ?? 2);
              })
              .map((stock: any) => (
                <StockCard key={stock.id} stock={stock} />
              ))}
            {dynamicStocks.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">No stock data available</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Nifty50;
