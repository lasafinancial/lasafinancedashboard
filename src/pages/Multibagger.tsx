import { useState, useMemo, useEffect } from "react";
import { Rocket, TrendingUp, Star, Filter, ArrowUpRight, Target, Info, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

    interface MultibaggerStock {
      sector: string;
      id: string;
      stockName: string;
      cmp: number;
      rsi: number;
      dRsiDiff: number;
      wRsi: number;
      dEma200: number;
      dEma63: number;
      peRatio: string;
      fiveYHigh: number;
      dEma200Status: string;
      algoB: string;
    }

export function Multibagger() {
  const navigate = useNavigate();
  const [selectedStock, setSelectedStock] = useState<MultibaggerStock | null>(null);
  const [stocks, setStocks] = useState<MultibaggerStock[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMultibagger = async () => {
      try {
        const response = await fetch("/api/multibagger");
        const data = await response.json();
        setStocks(data);
      } catch (error) {
        console.error("Error fetching multibagger data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMultibagger();
  }, []);
  
  const stats = useMemo(() => {
    if (stocks.length === 0) return { total: 0, avgRsi: 0, topRsi: 0 };
    const total = stocks.length;
    const avgRsi = stocks.reduce((acc, s) => acc + (Number(s.rsi) || 0), 0) / total;
    const topRsi = Math.max(...stocks.map(s => Number(s.rsi) || 0));
    return { total, avgRsi, topRsi };
  }, [stocks]);

    const handleStockClick = (stock: MultibaggerStock) => {
      // Use id (symbol) but fallback to stockName if id is missing
      const searchParam = stock.id || stock.stockName;
      navigate(`/stocks?symbol=${searchParam}`);
    };

  return (
    <div className="min-h-screen bg-[#020617] text-foreground selection:bg-primary/30">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/3 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      <div className="relative container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-[0.2em]">
            <Rocket className="w-3.5 h-3.5" />
            Multibagger Engine
          </div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
                STRATEGIC <span className="text-primary italic">CANDIDATES</span>
              </h1>
              <div className="flex flex-col items-end text-right">
                <p className="text-4xl font-black text-primary">
                  {isLoading ? <Loader2 className="w-8 h-8 animate-spin" /> : stats.total}
                </p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active Positions</p>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            <GlassCard className="p-8 flex items-center justify-between group border-primary/10">
              <div className="flex items-center gap-6">
                <div className="p-4 rounded-3xl bg-success/10 text-success group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] mb-1">Momentum Score</p>
                  <p className="text-4xl font-black">{isLoading ? "---" : stats.avgRsi.toFixed(1)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-success uppercase">Avg Daily RSI</p>
              </div>
            </GlassCard>

            <GlassCard className="p-8 flex items-center justify-between group border-primary/10">
              <div className="flex items-center gap-6">
                <div className="p-4 rounded-3xl bg-warning/10 text-warning group-hover:scale-110 transition-transform">
                  <Star className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] mb-1">Peak Intensity</p>
                  <p className="text-4xl font-black">{isLoading ? "---" : stats.topRsi.toFixed(1)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-warning uppercase">Highest RSI</p>
              </div>
            </GlassCard>
          </div>

          {/* Content */}
          {isLoading ? (
            <GlassCard className="p-20 text-center border-dashed border-2 border-primary/20">
              <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-8 animate-spin">
                <Loader2 className="w-12 h-12 text-primary/40" />
              </div>
              <h3 className="text-2xl font-black mb-3 uppercase tracking-tight">Synchronizing Data...</h3>
              <p className="text-muted-foreground max-w-md mx-auto font-medium">
                We are currently fetching the latest strategic candidates from your live sheet.
              </p>
            </GlassCard>
          ) : stocks.length === 0 ? (
            <GlassCard className="p-20 text-center border-dashed border-2 border-primary/20">
              <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-8">
                <Filter className="w-12 h-12 text-primary/40" />
              </div>
              <h3 className="text-2xl font-black mb-3 uppercase tracking-tight">No Candidates Found</h3>
              <p className="text-muted-foreground max-w-md mx-auto font-medium">
                Currently, no stocks match the Multibagger criteria in your sheet.
              </p>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {stocks.map((stock, index) => (
                <GlassCard
                  key={`${stock.id}-${index}`}
                  className="group relative overflow-hidden transition-all duration-500 hover:bg-white/[0.03] border-primary/5 hover:border-primary/30 p-8"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary/0 group-hover:bg-primary transition-all duration-500" />
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    {/* Stock Identification */}
                    <div className="flex items-center gap-8 min-w-[300px]">
                      <span className="text-2xl font-black text-primary/10 group-hover:text-primary/30 transition-colors tabular-nums">
                        {String(index + 1).padStart(3, "0")}
                      </span>
                      <div className="space-y-1">
                          <h3 className="text-3xl font-black tracking-tighter group-hover:text-primary transition-colors uppercase">
                            {stock.id}
                          </h3>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stock.sector}</p>
                        </div>
                      </div>

                      {/* Visual Divider */}
                      <div className="hidden md:block h-12 w-px bg-primary/10" />

                          {/* Card Metrics */}
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 flex-1">
                            <div className="space-y-1">
                              <p className="text-[9px] uppercase font-black text-muted-foreground tracking-[0.2em]">CLOSE_PRICE</p>
                              <p className="text-xl font-black tabular-nums">₹{Number(stock.cmp).toLocaleString()}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[9px] uppercase font-black text-muted-foreground tracking-[0.2em]">RSI</p>
                              <p className="text-xl font-black text-success tabular-nums">{Number(stock.rsi).toFixed(1)}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[9px] uppercase font-black text-muted-foreground tracking-[0.2em]">W_RSI</p>
                              <p className="text-xl font-black text-blue-400 tabular-nums">{Number(stock.wRsi).toFixed(1)}</p>
                            </div>
                          </div>

                  {/* Actions */}
                  <div className="flex items-center gap-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <button 
                          className="h-14 px-8 rounded-2xl bg-secondary/30 hover:bg-secondary/50 text-foreground transition-all border border-primary/10 hover:border-primary/40 font-black text-xs uppercase tracking-widest flex items-center gap-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStock(stock);
                          }}
                        >
                          <Info className="w-4 h-4 text-primary" />
                          Details
                        </button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px] bg-[#0c1120]/95 backdrop-blur-2xl border-primary/20 p-0 overflow-hidden rounded-[32px]">
                        <div className="p-8 border-b border-primary/10 bg-primary/5">
                          <DialogHeader>
                            <DialogTitle className="text-4xl font-black flex items-center gap-4 uppercase tracking-tighter">
                              <Target className="w-8 h-8 text-primary" />
                              {stock.id}
                            </DialogTitle>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-2">Strategic Parameter Scan</p>
                          </DialogHeader>
                        </div>
                        
                            <div className="p-8 grid grid-cols-2 gap-4">
                              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
                                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.2em] mb-1">PE-RATIO</p>
                                <p className="font-black text-xl tabular-nums">{stock.peRatio || 'N/A'}</p>
                              </div>
                              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
                                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.2em] mb-1">5Y_HIGH</p>
                                <p className="font-black text-xl tabular-nums">₹{Number(stock.fiveYHigh).toLocaleString()}</p>
                              </div>
                              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
                                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.2em] mb-1">D-EMA-63</p>
                                <p className="font-black text-xl tabular-nums">₹{Math.round(Number(stock.dEma63))}</p>
                              </div>
                                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
                                  <p className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.2em] mb-1">D-EMA-200-STATUS</p>
                                  <p className={`font-black text-xl tabular-nums ${stock.dEma200Status === 'ABOVE' ? 'text-success' : 'text-destructive'}`}>
                                    {stock.dEma200Status || 'N/A'}
                                  </p>
                                </div>
                                <div className="col-span-2 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
                                  <p className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.2em] mb-1">D-EMA-200</p>
                                  <p className="font-black text-xl tabular-nums">₹{Math.round(Number(stock.dEma200))}</p>
                                </div>
                              </div>

                        <div className="p-8 bg-primary/5">
                          <button 
                            className="w-full py-5 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-[0.2em] hover:brightness-110 transition-all shadow-2xl shadow-primary/40 active:scale-[0.98]"
                            onClick={() => handleStockClick(stock)}
                          >
                            Analyze Full Chart
                          </button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStockClick(stock);
                      }}
                      className="h-14 w-14 rounded-2xl bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground transition-all flex items-center justify-center border border-primary/20"
                    >
                      <ArrowUpRight className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Multibagger;