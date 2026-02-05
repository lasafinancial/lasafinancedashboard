import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, TrendingUp, Activity, TrendingDown, Loader2, Info, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StockPriceChart from "@/components/charts/StockPriceChart";
import StockStrengthZone from "@/components/charts/StockStrengthZone";
import { useLiveData } from "@/hooks/useLiveData";

interface HoveredData {
  date: string;
  price: number | null;
  support: number | null;
  resistance: number | null;
  model: number | null;
  pattern: number | null;
}

const StockAnalysis = () => {
  const [searchParams] = useSearchParams();
  const symbolFromUrl = searchParams.get("symbol");
  const { stockData: stocksData, isLoading, lastUpdate } = useLiveData();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStock, setSelectedStock] = useState<string>("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hoveredChartData, setHoveredChartData] = useState<HoveredData | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Helper for fuzzy matching and normalization
  const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, "");

  const getMatchScore = (target: string, query: string) => {
    const normTarget = normalize(target);
    const normQuery = normalize(query);

    // Exact match after normalization
    if (normTarget === normQuery) return 100;

    // Query is contained in target
    if (normTarget.includes(normQuery)) return 80;

    // Target is contained in query
    if (normQuery.includes(normTarget)) return 60;

    // Word based overlap
    const targetWords = target.toLowerCase().split(/[^a-z0-9]/).filter(w => w.length > 1);
    const queryWords = query.toLowerCase().split(/[^a-z0-9]/).filter(w => w.length > 1);

    let matches = 0;
    queryWords.forEach(qw => {
      if (targetWords.some(tw => tw.includes(qw) || qw.includes(tw))) matches++;
    });

    if (matches > 0) return (matches / queryWords.length) * 50;

    return 0;
  };

  useEffect(() => {
    if (stocksData.length > 0) {
      if (symbolFromUrl) {
        // Try exact match first
        let found = stocksData.find(s =>
          s.symbol.toLowerCase() === symbolFromUrl.toLowerCase() ||
          s.name.toLowerCase() === symbolFromUrl.toLowerCase()
        );

        // If not found, try normalization match
        if (!found) {
          const normUrl = normalize(symbolFromUrl);
          found = stocksData.find(s =>
            normalize(s.symbol) === normUrl ||
            normalize(s.name) === normUrl
          );
        }

        // If still not found, try best fuzzy match score
        if (!found) {
          const scoredStocks = stocksData.map(s => ({
            stock: s,
            score: Math.max(
              getMatchScore(s.name, symbolFromUrl),
              getMatchScore(s.symbol, symbolFromUrl)
            )
          })).filter(s => s.score > 30) // Minimum threshold
            .sort((a, b) => b.score - a.score);

          if (scoredStocks.length > 0) {
            found = scoredStocks[0].stock;
          }
        }

        if (found) {
          if (selectedStock !== found.symbol) {
            setSelectedStock(found.symbol);
            setSearchQuery(found.name);
          }
        } else {
          // If still not found, at least populate the search bar with what was requested
          setSearchQuery(symbolFromUrl);
          if (!selectedStock) {
            setSelectedStock(stocksData[0].symbol);
          }
        }
      } else if (!selectedStock) {
        // Smart default: Select the best performing stock of the day
        // This provides better UX by showing an interesting stock by default
        const stocksWithChange = stocksData
          .map(stock => {
            const history = stock.history || [];
            if (history.length < 2) return { stock, changePercent: 0 };

            // Calculate today's change percentage
            const latest = history[history.length - 1];
            const previous = history[history.length - 2];
            const changePercent = ((latest.price - previous.price) / previous.price) * 100;

            return { stock, changePercent };
          })
          .filter(item => item.changePercent > 0) // Only positive performers
          .sort((a, b) => b.changePercent - a.changePercent); // Sort by highest gain

        // Select best performer, or fallback to first stock if no gainers
        const defaultStock = stocksWithChange.length > 0
          ? stocksWithChange[0].stock
          : stocksData[0];

        setSelectedStock(defaultStock.symbol);
        setSearchQuery(defaultStock.name);
      }
    }
  }, [symbolFromUrl, stocksData]);

  const searchSuggestions = useMemo(() => {
    if (searchQuery.length === 0) return [];

    return stocksData.map(s => ({
      stock: s,
      score: Math.max(
        getMatchScore(s.name, searchQuery),
        // Boost symbol matches by 2x to prioritize IDs like TCS
        getMatchScore(s.symbol, searchQuery) * 2.0
      )
    }))
      .filter(s => s.score > 20)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(s => s.stock);
  }, [searchQuery, stocksData]);

  const currentStockData = stocksData.find(s => s.symbol === selectedStock);
  const isSearchQueryCurrentStock = currentStockData &&
    (searchQuery === currentStockData.name || searchQuery === currentStockData.symbol);

  const filteredStocks = isSearchQueryCurrentStock || searchQuery === ""
    ? stocksData
    : stocksData.filter(
      (stock) =>
        stock.symbol === selectedStock ||
        stock.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSuggestion = (symbol: string) => {
    const stock = stocksData.find(s => s.symbol === symbol);
    setSelectedStock(symbol);
    setSearchQuery(stock ? stock.name : "");
    setShowSuggestions(false);
  };

  const currentStock = stocksData.find((s) => s.symbol === selectedStock);
  const chartData = currentStock?.history || [];

  if (isLoading || stocksData.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading live stock data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-end">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold mb-2">
                Stock <span className="gradient-text italic pr-4">Analysis</span>
              </h1>
              <button
                onClick={() => setShowInfoModal(true)}
                className="p-2 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 hover:border-primary/40 hover:scale-105 transition-all duration-200 group shadow-[0_0_15px_rgba(var(--primary),0.1)]"
                title="Learn about Price Structure & Zone Analysis"
              >
                <Info className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
              </button>
            </div>
            <p className="text-muted-foreground">Historical charts and data from lasa-master</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Data Source: lasa-master (Live)</p>
            <p className="text-[10px] font-mono text-primary">Last Updated: {lastUpdate}</p>
          </div>
        </div>

        {/* Search and Controls */}
        <div className={`glass-card p-6 mb-6 animate-fade-in-up transition-all duration-300 ${showSuggestions && searchSuggestions.length > 0 ? 'relative z-50' : 'relative z-10'}`}>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input with Autocomplete */}
            <div className="flex-1 relative" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
              <Input
                placeholder="Search stocks by name or symbol..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="pl-10 search-input h-12 text-base w-full"
              />
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border/50 rounded-lg shadow-xl z-50 overflow-hidden max-h-[320px] overflow-y-auto">
                  {searchSuggestions.map((stock, index) => (
                    <button
                      key={stock.symbol}
                      onClick={() => handleSelectSuggestion(stock.symbol)}
                      className="w-full px-4 py-3 text-left hover:bg-accent/50 transition-colors flex items-center gap-3 border-b border-border/20 last:border-b-0"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">{stock.symbol.slice(0, 2).toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{stock.name}</p>
                        <p className="text-xs text-muted-foreground">{stock.sector}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono text-sm font-medium">₹{stock.price?.toLocaleString()}</p>
                        <p className={`text-xs ${stock.trend === 'UPTREND' ? 'text-success' : stock.trend === 'DOWNTREND' ? 'text-destructive' : 'text-warning'}`}>
                          {stock.trend}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Stock Selector */}
            <Select value={selectedStock} onValueChange={setSelectedStock}>
              <SelectTrigger className="w-full md:w-[280px] h-12 bg-secondary/50 border-border/50">
                <SelectValue placeholder="Select a stock" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border/50 max-h-[400px]">
                {filteredStocks.map((stock) => (
                  <SelectItem key={stock.symbol} value={stock.symbol}>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-primary">{stock.symbol}</span>
                      {stock.symbol !== stock.name && (
                        <>
                          <span className="text-muted-foreground">-</span>
                          <span className="text-sm">{stock.name}</span>
                        </>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="glass-card p-4 mb-6 animate-fade-in-up-delay-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-row items-center gap-6 lg:gap-10">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg shrink-0 ${currentStock?.resistanceSlopeDownward ? 'bg-destructive/10' : 'bg-success/10'}`}>
                {currentStock?.resistanceSlopeDownward ? (
                  <TrendingDown className="w-5 h-5 text-destructive" />
                ) : (
                  <TrendingUp className="w-5 h-5 text-success" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Current Price</p>
                <p className="text-lg font-black truncate">₹{currentStock?.price?.toLocaleString()}</p>
              </div>
            </div>


            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10 shrink-0">
                <Activity className="w-5 h-5 text-accent" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Daily RSI</p>
                <p className="text-lg font-black truncate">{currentStock?.rsi?.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex-shrink-0 text-right">
              <div className="inline-block px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Sector</span>
                <span className="text-sm font-bold text-primary">{currentStock?.sector}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="mb-6 animate-fade-in-up-delay-2">
          <StockPriceChart data={chartData} onHover={setHoveredChartData} />
        </div>

        {/* Data Table */}
        <div className="animate-fade-in-up-delay-3">
          <StockStrengthZone data={chartData} />
        </div>
      </div>

      {/* Info Modal */}
      {showInfoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowInfoModal(false)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-background/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between p-4 border-b border-white/10 bg-background/95 backdrop-blur-xl">
              <h3 className="text-lg font-semibold text-foreground">Price Structure & Zone Analysis</h3>
              <button
                onClick={() => setShowInfoModal(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-primary uppercase tracking-wide">Overview</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  This section is designed to give traders a deeper understanding of price structure using our proprietary algorithms. It helps users clearly identify whether a stock is trading in a strong zone, weak zone, or a range-bound structure, along with possible reference price levels.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-primary uppercase tracking-wide">Algorithm Insights</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Every day, our multimodal algorithms scan the top 500 stocks and generate price references using different analytical approaches:
                </p>
                <ul className="text-sm text-muted-foreground leading-relaxed list-disc list-inside ml-2 space-y-1">
                  <li><span className="text-primary font-medium">Modal Target</span> – derived from machine-learning models</li>
                  <li><span className="text-primary font-medium">Balance</span> – based on market balance and price equilibrium</li>
                  <li><span className="text-primary font-medium">Patterns</span> – identified using chart-pattern recognition</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-primary uppercase tracking-wide">Important Considerations</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Markets are dynamic, so these levels should be used only as reference points, not as fixed predictions. Traders should remain cautious:
                </p>
                <ul className="text-sm text-muted-foreground leading-relaxed list-disc list-inside ml-2 space-y-1">
                  <li>A close below the weak zone may lead to a breakdown</li>
                  <li>A close above strong zone may indicate a Breakout</li>
                </ul>
                <p className="text-sm text-muted-foreground leading-relaxed mt-3">
                  Our algorithms perform best when stocks are range-bound or moving within a controlled trend. They are not designed to predict stocks in very strong or runaway uptrends or downtrends.
                </p>
              </div>

              <div className="space-y-2 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                <h4 className="text-sm font-semibold text-destructive uppercase tracking-wide">Disclaimer</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  All price projections are for informational purposes only. This tool does not provide trading or investment advice. Please consult your financial advisor before making any trading decisions.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockAnalysis;
