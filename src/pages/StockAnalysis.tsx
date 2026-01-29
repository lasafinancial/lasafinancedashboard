import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, TrendingUp, Activity, TrendingDown, Loader2 } from "lucide-react";
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
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (stocksData.length > 0 && !selectedStock) {
      if (symbolFromUrl) {
        const found = stocksData.find(s => s.symbol === symbolFromUrl);
        setSelectedStock(found ? found.symbol : stocksData[0].symbol);
        if (found) setSearchQuery(found.name);
      } else {
        setSelectedStock(stocksData[0].symbol);
      }
    }
  }, [symbolFromUrl, stocksData, selectedStock]);

  const searchSuggestions = searchQuery.length > 0 
    ? stocksData.filter(
        (stock) =>
          stock.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          stock.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 8)
    : [];
  
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
            <h1 className="text-3xl font-bold mb-2">
              Stock <span className="gradient-text italic pr-4">Analysis</span>
            </h1>
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
    </div>
  );
};

export default StockAnalysis;
