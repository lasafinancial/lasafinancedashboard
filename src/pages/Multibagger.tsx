import { useState, useMemo, useEffect } from "react";
import { Rocket, TrendingUp, Star, Filter, ArrowUpRight, Target, Loader2, BarChart3, Sparkles, Coins, Info, X } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
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

// Historical Strategy Performance Data (2014-2026)
const strategyPerformanceData = [
  { year: "2014", value: 18319932.39 },
  { year: "2016", value: 44079749.07 },
  { year: "2017", value: 70965682.41 },
  { year: "2018", value: 68592280.29 },
  { year: "2019", value: 49479686 },
  { year: "2020", value: 68592280.29 },
  { year: "2021", value: 119543188.2 },
  { year: "2022", value: 114465781.5 },
  { year: "2023", value: 163658631.7 },
  { year: "2024", value: 210257307.5 },
  { year: "2025", value: 178789623.5 },
  { year: "2026", value: 185388176.1 },
];

const formatValueInCr = (value: number) => {
  return `${(value / 10000000).toFixed(1)} Cr`;
};

const growthData = [
  { year: "Year 1", value: 1000 },
  { year: "Year 2", value: 1000 },
  { year: "Year 3", value: 1333 },
  { year: "Year 4", value: 1778 },
  { year: "Year 5", value: 2371 },
  { year: "Year 6", value: 3162 },
  { year: "Year 7", value: 4216 },
  { year: "Year 8", value: 5623 },
  { year: "Year 9", value: 7498 },
  { year: "Year 10", value: 10000 },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  },
  hover: { 
    y: -2,
    transition: { duration: 0.2, ease: "easeOut" }
  }
};

export function Multibagger() {
  const navigate = useNavigate();
  const [selectedStock, setSelectedStock] = useState<MultibaggerStock | null>(null);
  const [stocks, setStocks] = useState<MultibaggerStock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showStrategyModal, setShowStrategyModal] = useState(false);

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
  
  const filteredStocks = useMemo(() => {
    return stocks.filter((stock) => stock.dEma200Status === "ABOVE" && Number(stock.rsi) < 60);
  }, [stocks]);

  const stats = useMemo(() => {
    if (filteredStocks.length === 0) return { total: 0, avgRsi: 0, topRsi: 0 };
    const total = filteredStocks.length;
    const avgRsi = filteredStocks.reduce((acc, s) => acc + (Number(s.rsi) || 0), 0) / total;
    const topRsi = Math.max(...filteredStocks.map(s => Number(s.rsi) || 0));
    return { total, avgRsi, topRsi };
  }, [filteredStocks]);

  const handleStockClick = (stock: MultibaggerStock) => {
    const searchParam = stock.id || stock.stockName;
    navigate(`/stocks?symbol=${searchParam}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 font-sans overflow-x-hidden">
      {/* Background Effects - matching Dashboard */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      <div className="relative container mx-auto px-4 pt-12 pb-8 lg:pt-16">
        {/* Header Section - Dashboard style */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 animate-fade-in"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider">
                <Rocket className="w-3 h-3" />
                Multibagger Engine v2.0
                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              </div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-none">
                  <span className="gradient-text italic pr-1">Multibagger</span>
                </h1>
                <button
                  onClick={() => setShowStrategyModal(true)}
                  className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary/20 hover:border-primary/40 transition-all duration-200 group"
                  title="Learn about the strategy"
                >
                  <Info className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground max-w-2xl font-medium leading-relaxed">
                AI-driven momentum filtering and value scanning for high-potential opportunities.
              </p>
            </div>
            
            <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Active Positions</p>
              <p className="text-2xl font-bold text-primary tabular-nums">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.total}
              </p>
            </div>
          </div>
          </motion.div>

          {/* Historical Strategy Performance Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-10"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div className="space-y-1">
                <h2 className="text-xl md:text-2xl font-bold tracking-tight">
                  Strategy <span className="gradient-text italic pr-1">Performance</span>
                </h2>
                <p className="text-sm text-muted-foreground font-medium">
                  Historical returns from 2014 to 2026
                </p>
              </div>
              
              <div className="flex items-center gap-4 px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground font-medium">2014</p>
                  <p className="text-base font-bold tabular-nums">₹1.8 Cr</p>
                </div>
                <div className="w-px h-6 bg-white/10" />
                <div>
                  <p className="text-xs text-success font-medium">2024 Peak</p>
                  <p className="text-base font-bold text-success tabular-nums">₹21 Cr</p>
                </div>
              </div>
            </div>

            <GlassCard 
              className="p-4 h-[350px] border-white/10 relative overflow-hidden"
              contentClassName="h-full w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={strategyPerformanceData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="strategyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="year" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 500 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 500 }}
                    tickFormatter={(value) => formatValueInCr(value)}
                    width={60}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                    }}
                    itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 600, fontSize: '13px' }}
                    labelStyle={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500, fontSize: '11px', marginBottom: '4px' }}
                    formatter={(value: number) => [`₹${formatValueInCr(value)}`, "Portfolio Value"]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2.5}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, fill: 'hsl(var(--primary))', stroke: 'white', strokeWidth: 2 }}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </GlassCard>
          </motion.div>

          {/* Main Content */}
          <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[300px]"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-t-2 border-primary animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Rocket className="w-6 h-6 text-primary" />
                </div>
              </div>
              <p className="mt-4 text-sm font-medium text-muted-foreground">Scanning markets...</p>
            </motion.div>
          ) : filteredStocks.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16 rounded-xl border border-dashed border-white/10 bg-white/[0.02]"
            >
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Filter className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Candidates Found</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                The engine is currently filtering for optimal risk-reward entries. Check back shortly.
              </p>
            </motion.div>
          ) : (
            <motion.div 
              key="list"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 gap-3"
            >
              {filteredStocks.map((stock, index) => (
                <motion.div
                  key={`${stock.id}-${index}`}
                  variants={cardVariants}
                  whileHover="hover"
                  layout
                >
                  <GlassCard className="relative p-0 overflow-hidden border-white/10 group">
                    {/* Status Accent */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/40 group-hover:bg-primary transition-all duration-300 z-20" />
                    
                    <div className="flex flex-col sm:flex-row items-stretch">
                      {/* Stock Info */}
                      <div className="flex items-center gap-4 p-4 sm:w-[280px] border-b sm:border-b-0 sm:border-r border-white/5">
                        <span className="text-lg font-bold text-muted-foreground tabular-nums w-8">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-semibold tracking-tight group-hover:text-primary transition-colors truncate">
                              {stock.id}
                            </h3>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground mt-0.5">
                            <BarChart3 className="w-3 h-3 text-primary/50" />
                            <span className="text-xs font-medium">{stock.sector}</span>
                          </div>
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="flex-1 grid grid-cols-3 gap-4 p-4 items-center">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-0.5">CMP</p>
                          <p className="text-base font-semibold tabular-nums">₹{Number(stock.cmp).toLocaleString()}</p>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-0.5">RSI</p>
                          <p className={`text-base font-semibold tabular-nums ${
                            Number(stock.rsi) > 50 ? 'text-success' : 'text-blue-400'
                          }`}>
                            {Number(stock.rsi).toFixed(1)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-0.5">Weekly RSI</p>
                          <p className="text-base font-semibold text-blue-400 tabular-nums">{Number(stock.wRsi).toFixed(1)}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 p-4 border-t sm:border-t-0 sm:border-l border-white/5">
                        <Dialog>
                          <DialogTrigger asChild>
                            <button 
                              className="h-9 px-4 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold hover:bg-white/10 hover:border-primary/30 transition-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedStock(stock);
                              }}
                            >
                              Details
                            </button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[450px]">
                            <DialogHeader>
                              <div className="flex items-center justify-between">
                                <div>
                                  <DialogTitle className="text-xl font-bold">
                                    {stock.id}
                                  </DialogTitle>
                                  <p className="text-xs text-muted-foreground mt-1">{stock.sector}</p>
                                </div>
                                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                                  <Target className="w-5 h-5 text-primary" />
                                </div>
                              </div>
                            </DialogHeader>
                            
                            <div className="grid grid-cols-2 gap-3 mt-4">
                              {[
                                { label: "PE Ratio", value: stock.peRatio || 'N/A' },
                                { label: "5Y High", value: `₹${Number(stock.fiveYHigh).toLocaleString()}` },
                                { label: "EMA 63", value: `₹${Math.round(Number(stock.dEma63))}` },
                                { label: "EMA 200", value: `₹${Math.round(Number(stock.dEma200))}` },
                              ].map((item, i) => (
                                <div key={i} className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                                  <p className="text-xs text-muted-foreground font-medium mb-1">{item.label}</p>
                                  <p className="font-semibold tabular-nums">{item.value}</p>
                                </div>
                              ))}
                              
                              <div className="col-span-2 p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-between">
                                <div>
                                  <p className="text-xs text-primary font-medium mb-1">200-EMA Status</p>
                                  <p className={`font-semibold ${stock.dEma200Status === 'ABOVE' ? 'text-success' : 'text-destructive'}`}>
                                    {stock.dEma200Status || 'N/A'}
                                  </p>
                                </div>
                                <div className={`p-2 rounded-lg ${stock.dEma200Status === 'ABOVE' ? 'bg-success/20' : 'bg-destructive/20'}`}>
                                  <ArrowUpRight className={`w-5 h-5 ${stock.dEma200Status === 'ABOVE' ? 'text-success' : 'text-destructive'}`} />
                                </div>
                              </div>
                            </div>

                            <button 
                              className="w-full mt-4 py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                              onClick={() => handleStockClick(stock)}
                            >
                              Open Analytics
                              <ArrowUpRight className="w-4 h-4" />
                            </button>
                          </DialogContent>
                        </Dialog>
                        
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStockClick(stock);
                          }}
                          className="h-9 w-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Growth Visualization Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-16 space-y-6"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                Wealth <span className="gradient-text italic pr-1">Projection</span>
              </h2>
              <p className="text-sm text-muted-foreground font-medium">
                10x return trajectory simulation (Year 1 to Year 10)
              </p>
            </div>
            
            <div className="flex items-center gap-4 px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="text-right">
                <p className="text-xs text-muted-foreground font-medium">Initial</p>
                <p className="text-lg font-bold tabular-nums">₹1,000</p>
              </div>
              <div className="w-px h-6 bg-white/10" />
              <div>
                <p className="text-xs text-primary font-medium">Year 10</p>
                <p className="text-lg font-bold text-primary tabular-nums">₹10,000</p>
              </div>
            </div>
          </div>

          <GlassCard 
            className="p-6 h-[350px] border-white/10 relative overflow-hidden group"
            contentClassName="h-full w-full"
          >
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <Coins className="w-24 h-24 text-primary" />
            </div>
            
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="year" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 500 }}
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                  }}
                  itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 600, fontSize: '13px' }}
                  labelStyle={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500, fontSize: '11px', marginBottom: '4px' }}
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, "Projected Value"]}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#growthGradient)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </GlassCard>
        </motion.div>
      </div>

      {/* Strategy Info Modal */}
      {showStrategyModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowStrategyModal(false)}
        >
          <div 
            className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-background/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between p-4 border-b border-white/10 bg-background/95 backdrop-blur-xl">
              <h3 className="text-base font-semibold">Multibagger Strategy (SIP-Based)</h3>
              <button
                onClick={() => setShowStrategyModal(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="space-y-1.5">
                <h4 className="text-xs font-semibold text-primary uppercase tracking-wide">Strategy Overview</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  This strategy follows a disciplined SIP approach in high-momentum stocks identified by our algorithm. Back-tested over the last 10 years, the strategy has delivered an average 25% CAGR consistently.
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-xs font-semibold text-primary uppercase tracking-wide">Investment Approach</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Instead of investing the full amount at once, a total corpus of ₹1,000 is deployed gradually. Each time a stock qualifies, only ₹10 is invested per stock. If the same stock appears again after 3 months, another ₹10 is invested in that stock.
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-xs font-semibold text-primary uppercase tracking-wide">Projected Returns</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Over a long-term horizon of 10 years, this disciplined SIP method has shown the potential to turn ₹1,000 into approximately ₹10,000, driven by consistent compounding at ~25% CAGR.
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-xs font-semibold text-primary uppercase tracking-wide">Algorithm Focus</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The underlying algorithm focuses on strong momentum stocks, combining price-action based patterns and trend strength to identify stocks with multibagger potential.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Multibagger;
