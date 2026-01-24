import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Landmark, ShoppingBag, HardHat, TrendingUp, TrendingDown, Factory, Boxes, Search, ChevronRight } from "lucide-react";
import { sectorData, stocks } from "@/data/stockData";

type Suggestion = {
  text: string;
  type: 'sector' | 'stock' | 'symbol';
};

const Sectors = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const availableSectors = Object.keys(sectorData);

  const handleStockClick = (symbol: string) => {
    navigate(`/stocks?symbol=${encodeURIComponent(symbol)}`);
  };

  // Generate prediction list once
  const allSearchableTerms = useMemo(() => {
    const terms: Suggestion[] = [];
    
    // Sectors
    Object.keys(sectorData).forEach(sector => {
      terms.push({ text: sector, type: 'sector' });
    });
    
    // Stocks and Symbols
    stocks.forEach(stock => {
      terms.push({ text: stock.name, type: 'stock' });
      terms.push({ text: stock.symbol, type: 'symbol' });
    });
    
    // Remove duplicates (e.g. if name is same as symbol)
    return terms.filter((v, i, a) => a.findIndex(t => t.text === v.text) === i);
  }, []);

  // Filter suggestions based on input
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase();
      const filtered = allSearchableTerms
        .filter(item => item.text.toLowerCase().includes(query))
        .sort((a, b) => {
          // Prioritize startsWith over includes
          const aStarts = a.text.toLowerCase().startsWith(query);
          const bStarts = b.text.toLowerCase().startsWith(query);
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;
          return 0;
        })
        .slice(0, 6);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
    setSelectedIndex(-1);
  }, [searchQuery, allSearchableTerms]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      setSearchQuery(suggestions[selectedIndex].text);
      setShowSuggestions(false);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const getSectorIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('bank')) return <Landmark className="w-6 h-6" />;
    if (n.includes('fmcg') || n.includes('food')) return <ShoppingBag className="w-6 h-6" />;
    if (n.includes('metal') || n.includes('steel')) return <HardHat className="w-6 h-6" />;
    if (n.includes('pharma') || n.includes('chemical')) return <Factory className="w-6 h-6" />;
    return <Boxes className="w-6 h-6" />;
  };

  const getSectorColor = (index: number) => {
    const colors = [
      "hsl(190, 95%, 50%)",
      "hsl(270, 95%, 65%)",
      "hsl(142, 76%, 45%)",
      "hsl(320, 95%, 60%)",
      "hsl(45, 93%, 47%)"
    ];
    return colors[index % colors.length];
  };

  const getSectorGradient = (index: number) => {
    const gradients = [
      "from-cyan-500/20 to-blue-500/20",
      "from-purple-500/20 to-pink-500/20",
      "from-green-500/20 to-emerald-500/20",
      "from-pink-500/20 to-rose-500/20",
      "from-orange-500/20 to-amber-500/20"
    ];
    return gradients[index % gradients.length];
  };

  const filteredSectorConfig = availableSectors.map((name, index) => {
    const stocksInSector = sectorData[name as keyof typeof sectorData];
    const matchesSector = name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const filteredStocks = stocksInSector.filter(stock => 
      stock.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (matchesSector) {
      return {
        name,
        icon: getSectorIcon(name),
        color: getSectorColor(index),
        gradient: getSectorGradient(index),
        stocks: stocksInSector,
        visible: true
      };
    }

    if (filteredStocks.length > 0) {
      return {
        name,
        icon: getSectorIcon(name),
        color: getSectorColor(index),
        gradient: getSectorGradient(index),
        stocks: filteredStocks,
        visible: true
      };
    }

    return {
      name,
      icon: getSectorIcon(name),
      color: getSectorColor(index),
      gradient: getSectorGradient(index),
      stocks: [],
      visible: false
    };
  }).filter(s => s.visible);

  return (
    <div className="min-h-screen bg-background">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Sector <span className="gradient-text italic pr-4">Overview</span>
            </h1>
            <p className="text-muted-foreground">Support and resistance levels across market sectors</p>
          </div>

          <div className="relative max-w-md w-full" ref={searchRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search sectors or stocks..."
                className="w-full bg-secondary/50 border border-border/50 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.length > 0 && setShowSuggestions(true)}
                onKeyDown={handleKeyDown}
              />
            </div>

            {/* Suggestions Prediction Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card/90 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-1.5">
                    Suggestions
                  </p>
                  {suggestions.map((item, index) => (
                    <button
                      key={index}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                        index === selectedIndex ? "bg-primary/10 text-primary" : "hover:bg-primary/5 text-foreground"
                      }`}
                      onClick={() => {
                        setSearchQuery(item.text);
                        setShowSuggestions(false);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          item.type === 'sector' ? 'bg-cyan-500' : 
                          item.type === 'symbol' ? 'bg-purple-500' : 'bg-emerald-500'
                        }`} />
                        <span className="font-medium">{item.text}</span>
                        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded uppercase text-muted-foreground">
                          {item.type}
                        </span>
                      </div>
                      <ChevronRight className="w-3 h-3 opacity-50" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sectors Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredSectorConfig.length > 0 ? (
            filteredSectorConfig.map((sector, sectorIndex) => (
              <div 
                key={sector.name} 
                className={`glass-card overflow-hidden animate-fade-in-up flex flex-col`}
                style={{ animationDelay: `${sectorIndex * 100}ms` }}
              >
                {/* Sector Header */}
                <div 
                  className={`p-3 md:p-4 border-b border-border/50 bg-gradient-to-r ${sector.gradient}`}
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className="p-2.5 rounded-xl shrink-0"
                      style={{ 
                        backgroundColor: `${sector.color}20`,
                        color: sector.color 
                      }}
                    >
                      {sector.icon}
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg md:text-xl font-bold truncate">{sector.name}</h2>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        {sector.stocks.length} stocks matched
                      </p>
                    </div>
                  </div>
                </div>

                {/* Table Header */}
                <div className="grid grid-cols-3 gap-2 px-4 md:px-6 py-2.5 bg-muted/30 border-b border-border/30">
                  <div className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
                    Stock
                  </div>
                  <div className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center flex items-center justify-center gap-1 truncate">
                    <TrendingDown className="w-3 h-3 text-success hidden sm:block" />
                    Support
                  </div>
                  <div className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center flex items-center justify-center gap-1 truncate">
                    <TrendingUp className="w-3 h-3 text-destructive hidden sm:block" />
                    Resist.
                  </div>
                </div>

                {/* Stock Rows */}
                <div className="divide-y divide-border/30 overflow-hidden">
                  {sector.stocks.map((stock, index) => (
                      <div 
                        key={stock.symbol}
                        className="grid grid-cols-3 gap-2 px-4 md:px-6 py-2 hover:bg-muted/20 transition-colors cursor-pointer group"
                        onClick={() => handleStockClick(stock.symbol)}
                      >
                      <div className="min-w-0">
                        <p className="font-medium text-xs md:text-sm group-hover:text-primary transition-colors truncate">
                          {stock.name}
                        </p>
                        {stock.name !== stock.symbol && (
                          <p className="text-[10px] md:text-xs text-muted-foreground font-mono truncate">{stock.symbol}</p>
                        )}
                      </div>
                      <div className="flex items-center justify-center">
                        <span className="font-mono font-medium text-success bg-success/10 px-2 md:px-3 py-1 rounded-lg text-[10px] md:text-sm whitespace-nowrap">
                          ₹{stock.support.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-center">
                        <span className="font-mono font-medium text-destructive bg-destructive/10 px-2 md:px-3 py-1 rounded-lg text-[10px] md:text-sm whitespace-nowrap">
                          ₹{stock.resistance.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center glass-card">
              <p className="text-muted-foreground text-lg">No sectors or stocks found matching "{searchQuery}"</p>
              <button 
                onClick={() => setSearchQuery("")}
                className="mt-4 text-primary font-bold hover:underline"
              >
                Clear search
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sectors;
