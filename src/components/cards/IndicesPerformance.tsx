import { useState, useMemo } from "react";
import { ChevronRight, TrendingUp, TrendingDown, X } from "lucide-react";
import stocksData from "@/data/processed/stock_data.json";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface IndexData {
  name: string;
  sector: string;
  strengthScore: number;
  stocksCount: number;
  bullishCount: number;
  bearishCount: number;
}

interface Stock {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  rsi: number;
  trend: string;
}

const getIndexData = (): IndexData[] => {
  const sectorMap: Record<string, Stock[]> = {};
  
  (stocksData as Stock[]).forEach((stock) => {
    const sector = stock.sector || "Other";
    if (sector.startsWith("NIFTY") || sector === "INDEX") {
      if (!sectorMap[sector]) {
        sectorMap[sector] = [];
      }
      sectorMap[sector].push(stock);
    }
  });

  return Object.entries(sectorMap).map(([sector, stocks]) => {
    const bullishCount = stocks.filter(s => s.rsi > 50 || s.trend === "UPTREND").length;
    const bearishCount = stocks.filter(s => s.rsi < 50 || s.trend === "DOWNTREND").length;
    const strengthScore = stocks.length > 0 ? Math.round((bullishCount / stocks.length) * 100) : 50;
    
    return {
      name: sector.replace("NIFTY-", "Nifty ").replace("INDEX", "Market Indices"),
      sector,
      strengthScore,
      stocksCount: stocks.length,
      bullishCount,
      bearishCount
    };
  }).sort((a, b) => b.strengthScore - a.strengthScore);
};

const getSectorStocks = (sector: string): Stock[] => {
  return (stocksData as Stock[]).filter(stock => stock.sector === sector);
};

const StrengthGauge = ({ score }: { score: number }) => {
  const getColor = (score: number) => {
    if (score >= 70) return "bg-success";
    if (score >= 50) return "bg-warning";
    return "bg-destructive";
  };

  const getGradient = (score: number) => {
    if (score >= 70) return "from-success/20 to-success/5";
    if (score >= 50) return "from-warning/20 to-warning/5";
    return "from-destructive/20 to-destructive/5";
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

export function IndicesPerformance() {
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const indexData = useMemo(() => getIndexData(), []);
  const sectorStocks = useMemo(() => 
    selectedSector ? getSectorStocks(selectedSector) : [], 
    [selectedSector]
  );

  const handleIndexClick = (sector: string) => {
    setSelectedSector(sector);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {indexData.map((index, i) => (
          <div
            key={index.sector}
            onClick={() => handleIndexClick(index.sector)}
            className="group p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all duration-300 cursor-pointer animate-fade-in"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${index.strengthScore >= 50 ? 'bg-success' : 'bg-destructive'} animate-pulse`} />
                <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">{index.name}</h4>
                <span className="text-[10px] text-muted-foreground/60 font-mono">({index.stocksCount} stocks)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${index.strengthScore >= 70 ? 'text-success' : index.strengthScore >= 50 ? 'text-warning' : 'text-destructive'}`}>
                  {index.strengthScore}%
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </div>
            <StrengthGauge score={index.strengthScore} />
            <div className="flex items-center gap-4 mt-3 text-[10px]">
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-success" />
                <span className="text-success font-bold">{index.bullishCount} Bullish</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-destructive" />
                <span className="text-destructive font-bold">{index.bearishCount} Bearish</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              {selectedSector?.replace("NIFTY-", "Nifty ").replace("INDEX", "Market Indices")}
              <span className="text-sm font-normal text-muted-foreground">
                ({sectorStocks.length} stocks)
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] pr-2 space-y-2">
            {sectorStocks.map((stock, i) => (
              <div 
                key={stock.symbol}
                className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{stock.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{stock.symbol}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-mono font-bold">₹{stock.price?.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">RSI: {stock.rsi}</p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                      stock.trend === "UPTREND" 
                        ? "bg-success/20 text-success border border-success/30" 
                        : "bg-destructive/20 text-destructive border border-destructive/30"
                    }`}>
                      {stock.trend === "UPTREND" ? (
                        <TrendingUp className="w-3 h-3 inline mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 inline mr-1" />
                      )}
                      {stock.trend}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {sectorStocks.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No stocks found in this sector
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default IndicesPerformance;
