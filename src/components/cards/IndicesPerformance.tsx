import { useState } from "react";
import { ChevronRight, ChevronDown, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { useLiveData } from "@/hooks/useLiveData";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InfoModal, InfoModalTrigger, useInfoModal } from "@/components/ui/InfoModal";

interface IndexStock {
  id: string;
  stockName: string;
  price: number;
  status: string;
  upperRange: number;
  lowerRange: number;
}

interface IndexData {
  name: string;
  stocksCount: number;
  bullishCount: number;
  bearishCount: number;
  strengthScore: number;
  stocks: IndexStock[];
}

const StrengthGauge = ({ score }: { score: number }) => {
  const getColor = (score: number) => {
    if (score >= 70) return "bg-success";
    if (score >= 50) return "bg-warning";
    return "bg-destructive";
  };

  return (
    <div className="flex items-center gap-3 w-full">
      <span className="text-[10px] font-bold text-destructive uppercase tracking-wider w-16">Weak</span>
      <div className="flex-1 h-3 rounded-full bg-gradient-to-r from-destructive/30 via-warning/30 to-success/30 relative overflow-hidden">
        <div 
          className={`absolute left-0 top-0 h-full rounded-full ${getColor(score)} transition-all duration-500 shadow-lg`}
          style={{ width: `${score}%` }}
        />
        <div 
          className={`absolute top-0 h-full w-1 bg-white/80 rounded-full shadow-md transition-all duration-500`}
          style={{ left: `calc(${score}% - 2px)` }}
        />
      </div>
      <span className="text-[10px] font-bold text-success uppercase tracking-wider w-16 text-right">Strong</span>
    </div>
  );
};

const StockRangeBar = ({ price, lowerRange, upperRange }: { price: number; lowerRange: number; upperRange: number }) => {
  const actualMin = Math.min(price, lowerRange);
  const actualMax = Math.max(price, upperRange);
  const padding = (actualMax - actualMin) * 0.1;
  const displayMin = actualMin - padding;
  const displayMax = actualMax + padding;
  const displayRange = displayMax - displayMin;
  
  const pricePosition = displayRange > 0 ? ((price - displayMin) / displayRange) * 100 : 50;
  const lowerPosition = displayRange > 0 ? ((lowerRange - displayMin) / displayRange) * 100 : 25;
  const upperPosition = displayRange > 0 ? ((upperRange - displayMin) / displayRange) * 100 : 75;
  
  const isInRange = price >= lowerRange && price <= upperRange;
  const isBelowRange = price < lowerRange;
  
  return (
    <div className="mt-3 px-2">
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-bold text-destructive/80 w-8">W</span>
          <div className="flex-1 h-4 rounded-full bg-gradient-to-r from-destructive via-warning to-success relative shadow-inner overflow-hidden">
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-white shadow-[0_0_8px_rgba(255,255,255,0.8),0_0_16px_rgba(255,255,255,0.4)] transition-all duration-300"
              style={{ left: `calc(${pricePosition}% - 7px)` }}
            />
        </div>
        <span className="text-[9px] font-bold text-success/80 w-8 text-right">S</span>
      </div>
      <div className="flex justify-between mt-1.5 text-[9px]">
        <span className="text-destructive/70 font-mono">₹{lowerRange?.toLocaleString()}</span>
        <span className="text-muted-foreground font-mono font-bold">₹{price?.toLocaleString()}</span>
        <span className="text-success/70 font-mono">₹{upperRange?.toLocaleString()}</span>
      </div>
    </div>
  );
};

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

const StockCard = ({ stock }: { stock: IndexStock }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { pricePosition } = calculatePricePosition(stock.price, stock.lowerRange, stock.upperRange);
  const status = getDynamicStatus(stock.price, stock.lowerRange, stock.upperRange);
  
  const isBullish = status === "BULLISH";
  const isBearish = status === "BEARISH";
  const isNeutral = status === "NEUTRAL";
  
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
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
              isBullish ? "bg-success animate-pulse" : isBearish ? "bg-destructive animate-pulse" : "bg-warning animate-pulse"
            }`} />
          <span className="font-medium text-sm truncate">{stock.stockName}</span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="font-mono text-sm font-bold">₹{stock.price?.toLocaleString()}</span>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </div>
      {isExpanded && (
        <div className="pb-3 border-t border-white/5">
          <StockRangeBar 
            price={stock.price} 
            lowerRange={stock.lowerRange} 
            upperRange={stock.upperRange}
            pricePosition={pricePosition}
          />
        </div>
      )}
    </div>
  );
};

export function IndicesPerformance() {
  const [selectedIndex, setSelectedIndex] = useState<IndexData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { indexPerformance, isLoading } = useLiveData();
  const { showModal, openModal, closeModal } = useInfoModal();

  const indexData = [...(indexPerformance || [])]
    .map(index => {
      const dynamicStocks = index.stocks || [];
      const bullishCount = dynamicStocks.filter(s => getDynamicStatus(s.price, s.lowerRange, s.upperRange) === "BULLISH").length;
      const bearishCount = dynamicStocks.filter(s => getDynamicStatus(s.price, s.lowerRange, s.upperRange) === "BEARISH").length;
      const dynamicStrengthScore = dynamicStocks.length > 0 ? Math.round((bullishCount / dynamicStocks.length) * 100) : 0;
      return { ...index, bullishCount, bearishCount, dynamicStrengthScore };
    })
    .sort((a, b) => b.dynamicStrengthScore - a.dynamicStrengthScore);

  const handleIndexClick = (index: any) => {
    setSelectedIndex(index);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 animate-pulse">
            <div className="h-4 bg-white/10 rounded w-1/3 mb-3"></div>
            <div className="h-3 bg-white/10 rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!indexData.length) {
    return (
      <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center text-muted-foreground">
        No index data available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <BarChart3 className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Index Strength Overview</h3>
        </div>
        <InfoModalTrigger onClick={openModal} />
      </div>
        <div className="space-y-3">
          {indexData.map((index: any, i) => {
            const { bullishCount, bearishCount, dynamicStrengthScore } = index;

            return (
              <div
                key={index.name}
                onClick={() => handleIndexClick(index)}
                className="group p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all duration-300 cursor-pointer animate-fade-in"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${dynamicStrengthScore >= 50 ? 'bg-success' : 'bg-destructive'} animate-pulse`} />
                    <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">{index.name}</h4>
                    <span className="text-[10px] text-muted-foreground/60 font-mono">({index.stocksCount} stocks)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${dynamicStrengthScore >= 70 ? 'text-success' : dynamicStrengthScore >= 50 ? 'text-warning' : 'text-destructive'}`}>
                      {dynamicStrengthScore}%
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
                <StrengthGauge score={dynamicStrengthScore} />
                <div className="flex items-center gap-4 mt-3 text-[10px]">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-success" />
                    <span className="text-success font-bold">{bullishCount} Bullish</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingDown className="w-3 h-3 text-destructive" />
                    <span className="text-destructive font-bold">{bearishCount} Bearish</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>


      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              {selectedIndex?.name}
              <span className="text-sm font-normal text-muted-foreground">
                ({selectedIndex?.stocksCount} stocks)
              </span>
            </DialogTitle>
            </DialogHeader>
            {(() => {
              const dynamicStocks = selectedIndex?.stocks || [];
              const bullish = dynamicStocks.filter(s => getDynamicStatus(s.price, s.lowerRange, s.upperRange) === "BULLISH").length;
              const bearish = dynamicStocks.filter(s => getDynamicStatus(s.price, s.lowerRange, s.upperRange) === "BEARISH").length;
              const neutral = dynamicStocks.length - bullish - bearish;
              
              return (
                <div className="flex items-center gap-4 text-xs mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-success shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                    <span className="text-muted-foreground">Bullish ({bullish})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                    <span className="text-muted-foreground">Bearish ({bearish})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-warning shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                    <span className="text-muted-foreground">Neutral ({neutral})</span>
                  </div>
                </div>
              );
            })()}
            <div className="overflow-y-auto max-h-[55vh] pr-2 space-y-2">

                {selectedIndex?.stocks
                  .slice()
                  .sort((a, b) => {
                    const statusA = getDynamicStatus(a.price, a.lowerRange, a.upperRange);
                    const statusB = getDynamicStatus(b.price, b.lowerRange, b.upperRange);
                    const order = { BULLISH: 0, BEARISH: 1, NEUTRAL: 2 };
                    const aOrder = order[statusA] ?? 2;
                    const bOrder = order[statusB] ?? 2;
                    return aOrder - bOrder;
                  })
                  .map((stock) => (

                <StockCard key={stock.id} stock={stock} />
              ))}
            {(!selectedIndex?.stocks || selectedIndex.stocks.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                No stocks found in this index
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <InfoModal
        isOpen={showModal}
        onClose={closeModal}
        title="Understanding Index Performance"
        sections={[
          {
            heading: "What is Index Strength?",
            content: "Index Strength measures the overall health of each market index by analyzing the bullish/bearish positioning of its constituent stocks. A higher strength score indicates more stocks within the index are showing bullish patterns."
          },
          {
            heading: "Strength Score Interpretation",
            content: "70%+ (Strong): Majority of stocks are bullish, favorable for long positions. 50-70% (Moderate): Mixed signals, selective approach recommended. Below 50% (Weak): More stocks are bearish, exercise caution with longs."
          },
          {
            heading: "Stock Cards with Glow",
            content: "Green glow indicates bullish stocks, red glow indicates bearish stocks. Click on any stock to expand and see its position on the Weak-to-Strong range bar."
          },
          {
            heading: "Range Bar (W to S)",
            content: "The range bar shows where the current price sits between the Weak (lower) and Strong (upper) range. A position closer to S indicates strength, while closer to W indicates weakness."
          }
        ]}
        videoLink="#"
      />
    </div>
  );
}

export default IndicesPerformance;
