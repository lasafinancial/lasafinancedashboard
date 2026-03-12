import { useState } from "react";
import { ChevronRight, ChevronDown, TrendingUp, TrendingDown, Activity, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { useLiveData } from "@/hooks/useLiveData";
import StockPriceChart from "@/components/charts/StockPriceChart";
import {
  Dialog,
  DialogContent,
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

// ---- Main Page ----
const Nifty50 = () => {
  const { nifty50Stocks, stockData, isLoading } = useLiveData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
          <h1 className="text-2xl font-bold gradient-text">NIFTY 50</h1>
          <p className="text-sm text-muted-foreground">Live Index Performance &amp; Stock Analysis</p>
        </div>
      </motion.div>

      {/* Index Strength Card — looks exactly like the IndicesPerformance card */}
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
