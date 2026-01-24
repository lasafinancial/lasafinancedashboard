import { useState } from "react";
import { Rocket, TrendingUp, Star, Filter, ArrowUpRight, Target } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import stocksData from "@/data/processed/stock_data.json";
import { useNavigate } from "react-router-dom";

const Multibagger = () => {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<"potential" | "momentum" | "name">("potential");

  const multibaggerStocks = stocksData
    .filter((stock) => {
      const latestHistory = stock.history?.[stock.history.length - 1];
      if (!latestHistory) return false;
      const potential = ((latestHistory.resistance - stock.price) / stock.price) * 100;
      return potential > 20 && stock.trend === "UPTREND";
    })
    .map((stock) => {
      const latestHistory = stock.history?.[stock.history.length - 1];
      const potential = latestHistory ? ((latestHistory.resistance - stock.price) / stock.price) * 100 : 0;
      return { ...stock, potential, latestHistory };
    })
    .sort((a, b) => {
      if (sortBy === "potential") return b.potential - a.potential;
      if (sortBy === "momentum") return (b.rsi || 0) - (a.rsi || 0);
      return a.name.localeCompare(b.name);
    });

  const handleStockClick = (symbol: string) => {
    navigate(`/stocks?symbol=${symbol}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-3">
              <Rocket className="w-3 h-3" />
              High Potential Stocks
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-none">
              Multibagger <span className="gradient-text italic pr-2">Candidates</span>
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl font-medium mt-2">
              Stocks with strong uptrend momentum and significant upside potential based on resistance levels.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-secondary/50 border border-border/50 rounded-lg px-3 py-2 text-sm"
            >
              <option value="potential">Sort by Potential</option>
              <option value="momentum">Sort by RSI</option>
              <option value="name">Sort by Name</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <Target className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Total Candidates</p>
                <p className="text-2xl font-bold">{multibaggerStocks.length}</p>
              </div>
            </div>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Avg Potential</p>
                <p className="text-2xl font-bold">
                  {multibaggerStocks.length > 0 
                    ? (multibaggerStocks.reduce((acc, s) => acc + s.potential, 0) / multibaggerStocks.length).toFixed(1) 
                    : 0}%
                </p>
              </div>
            </div>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Star className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Top Potential</p>
                <p className="text-2xl font-bold">
                  {multibaggerStocks.length > 0 
                    ? Math.max(...multibaggerStocks.map(s => s.potential)).toFixed(1)
                    : 0}%
                </p>
              </div>
            </div>
          </GlassCard>
        </div>

        {multibaggerStocks.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <Rocket className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Multibagger Candidates Found</h3>
            <p className="text-sm text-muted-foreground">
              Currently no stocks meet the multibagger criteria (uptrend + &gt;20% potential).
            </p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {multibaggerStocks.map((stock) => (
              <GlassCard
                key={stock.symbol}
                className="p-4 cursor-pointer hover:border-primary/30 transition-all"
                onClick={() => handleStockClick(stock.symbol)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-sm">{stock.name}</h3>
                    <p className="text-xs text-muted-foreground">{stock.symbol}</p>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-success/10 text-success text-xs font-semibold">
                    <ArrowUpRight className="w-3 h-3" />
                    {stock.potential.toFixed(1)}%
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Price</p>
                    <p className="font-mono font-semibold">₹{stock.price?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Target</p>
                    <p className="font-mono font-semibold text-success">
                      ₹{stock.latestHistory?.resistance?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">RSI</p>
                    <p className="font-mono font-semibold">{stock.rsi?.toFixed(1)}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border/30">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">{stock.sector}</span>
                    <span className="text-success font-semibold">{stock.trend}</span>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Multibagger;
