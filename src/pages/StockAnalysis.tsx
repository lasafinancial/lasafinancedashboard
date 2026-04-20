import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, TrendingUp, Activity, TrendingDown, Loader2, Info, X, PlayCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import StockPriceChart from "@/components/charts/StockPriceChart";
import StockStrengthZone from "@/components/charts/StockStrengthZone";
import { useLiveData } from "@/hooks/useLiveData";
import { getStockNarration } from "@/lib/gemini";
import TrendlyneWidget from "@/components/charts/TrendlyneWidget";
import TechnicalAnalysisWidget from "@/components/charts/TechnicalAnalysisWidget";
import { PremiumProtector } from "@/components/ui/PremiumProtector";
import { useAuth } from "@/context/AuthContext";

interface HoveredData {
  date: string;
  price: number | null;
  support: number | null;
  resistance: number | null;
  model: number | null;
  pattern: number | null;
}

const StockAnalysis = () => {
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const symbolFromUrl = searchParams.get("symbol");
  const { stockData: stocksData, isLoading, lastUpdate, nearResistance: nrData } = useLiveData();
  const { isFree, isPro, isElite, userData, user } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStock, setSelectedStock] = useState<string>("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hoveredChartData, setHoveredChartData] = useState<HoveredData | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showVideoModalHindi, setShowVideoModalHindi] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Usage Limit Logic
  const [usageCount, setUsageCount] = useState(0);
  const [isDailyLimitReached, setIsDailyLimitReached] = useState(false);

  useEffect(() => {
    if (!isFree) return;

    const today = new Date().toISOString().split('T')[0];
    const stored = localStorage.getItem(`usage_limit_${user?.uid || 'guest'}_${today}`);
    const count = stored ? parseInt(stored) : 0;
    setUsageCount(count);

    if (count >= 3) {
      setIsDailyLimitReached(true);
    }
  }, [isFree, user?.uid]);

  const incrementUsage = () => {
    if (!isFree) return;

    const today = new Date().toISOString().split('T')[0];
    const newCount = usageCount + 1;
    setUsageCount(newCount);
    localStorage.setItem(`usage_limit_${user?.uid || 'guest'}_${today}`, newCount.toString());

    if (newCount >= 3) {
      setIsDailyLimitReached(true);
    }
  };

  useEffect(() => {
    const hasSeen = localStorage.getItem("hasSeenStockDisclaimer");
    if (!hasSeen) {
      setShowDisclaimer(true);
    }
  }, []);

  const handleAcceptDisclaimer = () => {
    localStorage.setItem("hasSeenStockDisclaimer", "true");
    setShowDisclaimer(false);
  };

  // Helper for fuzzy matching and normalization
  const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, "");

  const getMatchScore = (target: string, query: string) => {
    const normTarget = normalize(target);
    const normQuery = normalize(query);

    // Exact match after normalization
    if (normTarget === normQuery) return 100;

    // Query is contained in target
    if (normTarget.includes(normQuery) || (normQuery.length > 2 && normTarget.includes(normQuery))) return 80;

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
        // Default to RELIANCE for first-time page load
        // We set it in the URL to trigger the robust 'symbolFromUrl' pipeline
        const reliance = stocksData.find(s =>
          s.symbol.trim().toUpperCase() === "RELIANCE" ||
          s.name.trim().toUpperCase().includes("RELIANCE")
        );

        const defaultStock = reliance || stocksData[0];

        if (defaultStock) {
          setSearchParams({ symbol: defaultStock.symbol });
          setSelectedStock(defaultStock.symbol);
          setSearchQuery(defaultStock.name);
        }
      }
    }
  }, [symbolFromUrl, stocksData, selectedStock, setSearchParams]);

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

  const currentStockData = stocksData.find(s =>
    s.symbol.trim().toUpperCase() === selectedStock.trim().toUpperCase()
  );
  const isSearchQueryCurrentStock = currentStockData &&
    (searchQuery.trim().toLowerCase() === currentStockData.name.trim().toLowerCase() ||
      searchQuery.trim().toUpperCase() === currentStockData.symbol.trim().toUpperCase());

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
      const target = event.target as Node;
      // Ensure the target is still in the document to avoid "Node missing" errors
      if (document.body.contains(target) && searchRef.current && !searchRef.current.contains(target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSuggestion = (symbol: string) => {
    setSearchParams({ symbol });
    setShowSuggestions(false);
    if (symbol !== selectedStock) {
      incrementUsage();
    }
  };

  const currentStock = stocksData.find((s) =>
    s.symbol.trim().toUpperCase() === selectedStock.trim().toUpperCase()
  );

  // Mobile optimization: Only show the last 1 month (approx 22 trading days) of data on mobile devices
  const chartData = useMemo(() => {
    const fullHistory = currentStock?.history || [];
    if (isMobile && fullHistory.length > 22) {
      return fullHistory.slice(-22);
    }
    return fullHistory;
  }, [currentStock, isMobile]);

  const calculatedTrend = useMemo(() => {
    const history = currentStock?.history || [];
    if (history.length >= 5) {
      const latest = history[history.length - 1];
      const prev = history[history.length - 5];
      const isSupportIncreasing = latest.support > prev.support;
      const isResistanceDecreasing = latest.resistance < prev.resistance;

      if (isSupportIncreasing) return "UPTREND";
      if (isResistanceDecreasing) return "DOWNTREND";
    }
    return "NEUTRAL";
  }, [currentStock]);

  // Rule Engine Constants
  const RESISTANCE_PROXIMITY_PCT = 0.5;
  const SUPPORT_PROXIMITY_PCT = 0.5;
  const BREAKOUT_PROXIMITY_PCT = 2.0;
  const OVERSOLD_RSI = 30;
  const OVERBOUGHT_RSI = 70;
  const TRENDING_SUPPORT_GAP_PCT = 5.0; // price >5% above support = potential trending/discovery mode

  const pctDiff = (price: number, level: number) => ((price - level) / level) * 100;

  // Boss's Analysis Logic Engine (Ported from Rule Engine)
  const analysisResult = useMemo(() => {
    if (!currentStock || !currentStock.history || currentStock.history.length === 0) return null;

    const history = currentStock.history;
    const latest = history[history.length - 1];

    // -- LOOK BACK FOR VALID LEVELS --
    // Sometimes the latest candle has null levels; we look back to find the most recent ones.
    let lastValidSupport = 0;
    let lastValidResist = 0;
    let lastValidFvg = 0;
    let lastValidMl = 0;
    let lastValidWolfeBull = 0;
    let lastValidWolfeBear = 0;

    for (let i = history.length - 1; i >= 0; i--) {
      if (lastValidSupport === 0 && history[i].support > 0) lastValidSupport = history[i].support;
      if (lastValidResist === 0 && history[i].resistance > 0) lastValidResist = history[i].resistance;
      if (lastValidFvg === 0 && history[i].projFvg > 0) lastValidFvg = history[i].projFvg;
      if (lastValidMl === 0 && history[i].mlFutPrice20d > 0) lastValidMl = history[i].mlFutPrice20d;
      if (lastValidWolfeBull === 0 && history[i].wolfeD > 0) lastValidWolfeBull = history[i].wolfeD;

      const bear = (history[i] as any).wolfeDBearish || (history[i] as any).wolfe_d_bearish || 0;
      if (lastValidWolfeBear === 0 && bear > 0) lastValidWolfeBear = bear;

      if (lastValidSupport > 0 && lastValidResist > 0 && lastValidFvg > 0 && lastValidMl > 0 && lastValidWolfeBull > 0) break;
    }

    const close = latest.price;
    const support = latest.support || lastValidSupport;
    const resist = latest.resistance || lastValidResist;
    const mlTgt = latest.mlFutPrice20d || lastValidMl;
    const mlDiff = latest.mlCurrentDiff;
    const wRsi = currentStock.rsi || 50;
    const balance = latest.projFvg || lastValidFvg;

    const result = {
      stock: currentStock.symbol,
      date: latest.date,
      close: close,
      support: support,
      resistance: resist,
      signals: [] as string[],
      warnings: [] as string[],
      targets: {} as Record<string, number>,
      stopLevels: {} as Record<string, number>,
      bias: "" as "BULLISH" | "BEARISH" | "MIXED" | "TRENDING",
      action: "",
      marketContext: "NORMAL" as "NORMAL" | "TRENDING",
      hardStopTriggered: null as string | null,
      bottomLine: ""
    };

    let bullishPts = 0;
    let bearishPts = 0;

    // -- PRICE vs SUPPORT / RESISTANCE --
    const pctFromResist = resist > 0 ? pctDiff(close, resist) : null;
    const pctFromSupport = support > 0 ? pctDiff(close, support) : null;

    if (pctFromResist !== null && pctFromResist > 0 && pctFromResist <= BREAKOUT_PROXIMITY_PCT) {
      result.signals.push(`Fresh breakout above Resistance ₹${resist.toLocaleString()} — old resistance now support.`);
      result.stopLevels["breakout_support"] = resist;
      bullishPts += 2;
    } else if (pctFromResist !== null && Math.abs(pctFromResist) <= RESISTANCE_PROXIMITY_PCT) {
      result.signals.push(`Price at Resistance ₹${resist.toLocaleString()} — poor buy zone.`);
      result.warnings.push("Avoid entry at resistance. Wait for breakout confirmation.");
      bearishPts += 1;
    } else if (pctFromResist !== null && pctFromResist < 0 && Math.abs(pctFromResist) > RESISTANCE_PROXIMITY_PCT) {
      if (pctFromSupport !== null && Math.abs(pctFromSupport) <= SUPPORT_PROXIMITY_PCT) {
        result.signals.push(`Price at Support ₹${support.toLocaleString()} — potential bounce zone.`);
        result.stopLevels["support"] = support;
        bullishPts += 1;
      } else if (pctFromSupport !== null && pctFromSupport < 0) {
        result.signals.push(`Price BELOW Support ₹${support.toLocaleString()} — breakdown in progress.`);
        result.warnings.push("Support broken. Avoid longs.");
        bearishPts += 2;
      } else if (pctFromSupport !== null) {
        result.signals.push(`Price in range between Support ₹${support.toLocaleString()} and Resistance ₹${resist.toLocaleString()}.`);
        result.warnings.push("No-man's land — wait for move toward either level.");
      }
    }

    // -- MODEL (ML) --
    if (mlTgt > 0) {
      const mlUpsidePct = pctDiff(mlTgt, close);
      result.targets["model"] = mlTgt;
      if (mlTgt > close) {
        result.signals.push(`Model target ₹${mlTgt.toLocaleString()} — ${mlUpsidePct.toFixed(1)}% upside over 20 days.`);
        if (mlDiff < -30) {
          result.signals.push(`Price is running below Model expectation (diff: ${mlDiff}) — Model sees undervaluation.`);
          bullishPts += 1;
        } else if (mlDiff > 30) {
          result.warnings.push(`Price is running above Model expectation (diff: +${mlDiff}) — overextended.`);
          bearishPts += 1;
        }
      } else {
        result.signals.push(`Model target ₹${mlTgt.toLocaleString()} is BELOW current price — Model is bearish.`);
        result.warnings.push(`Model projects ${Math.abs(mlUpsidePct).toFixed(1)}% downside.`);
        bearishPts += 2;
      }
    }

    // -- BALANCE (FVG) --
    if (balance > 0) {
      const pctFromBalance = pctDiff(balance, close);
      result.targets["balance"] = balance;
      if (balance > close) {
        result.signals.push(`Active Balance (FVG) at ₹${balance.toLocaleString()} — ${pctFromBalance.toFixed(1)}% above, acts as upside magnet.`);
        bullishPts += 1;
      } else {
        result.signals.push(`Active Balance (FVG) at ₹${balance.toLocaleString()} — below price, acts as downside magnet if price pulls back.`);
        bearishPts += 1;
      }
    }

    // -- PATTERN (WOLFE WAVE) --
    const wolfeBull = latest.wolfeD || lastValidWolfeBull;
    if (wolfeBull > 0) {
      result.signals.push(`Bullish Pattern active — target ₹${wolfeBull.toLocaleString()}.`);
      result.targets["pattern"] = wolfeBull;
      bullishPts += 2;
    }
    const wolfeBear = (latest as any).wolfeDBearish || (latest as any).wolfe_d_bearish || lastValidWolfeBear;
    if (wolfeBear > 0) {
      result.signals.push(`Bearish Pattern active — downside target ₹${wolfeBear.toLocaleString()}.`);
      result.targets["bearish_pattern"] = wolfeBear;
      bearishPts += 2;
    }

    // -- WEEKLY RSI --
    if (wRsi <= OVERSOLD_RSI) {
      result.signals.push(`Weekly RSI at ${wRsi.toFixed(1)} — deeply oversold, watch for reversal.`);
      bullishPts += 1;
    } else if (wRsi >= OVERBOUGHT_RSI) {
      result.signals.push(`Weekly RSI at ${wRsi.toFixed(1)} — approaching overbought, upside may be limited.`);
      result.warnings.push("Weekly RSI overbought — be cautious on fresh longs.");
      bearishPts += 1;
    } else {
      result.signals.push(`Weekly RSI at ${wRsi.toFixed(1)} — neutral, room to move in either direction.`);
    }

    // -- MARKET CONTEXT DETECTION --
    const isTrending = (
      pctFromSupport !== null && pctFromSupport > TRENDING_SUPPORT_GAP_PCT &&
      pctFromResist !== null && pctFromResist >= -RESISTANCE_PROXIMITY_PCT &&
      mlTgt > close
    );

    if (isTrending) {
      result.marketContext = "TRENDING";
      result.signals.push(
        `Stock is in price discovery — trading ${pctFromSupport.toFixed(1)}% above Support ₹${support.toLocaleString()}. ` +
        `Moving strongly through resistance levels.`
      );
      // Clean up contradictory warnings
      result.warnings = result.warnings.filter(w => !w.toLowerCase().includes("resistance"));
    }

    // -- BIAS & ACTION --
    if (isTrending) {
      result.bias = "TRENDING";
      result.action = `HOLD with strict stop at Support ₹${support.toLocaleString()}. Stock moving strongly — all upside targets valid. If Support ₹${support.toLocaleString()} breaks, exit immediately.`;
    } else if (bullishPts > bearishPts + 1) {
      result.bias = "BULLISH";
      if (pctFromResist !== null && pctFromResist > 0) result.action = `BUY — Breakout confirmed. Stop below ₹${resist.toLocaleString()}.`;
      else if (pctFromSupport !== null && Math.abs(pctFromSupport) <= SUPPORT_PROXIMITY_PCT) result.action = "BUY — On support confirmation";
      else result.action = "WAIT — Bullish bias, await better entry";
    } else if (bearishPts > bullishPts + 1) {
      result.bias = "BEARISH";
      if ((pctFromResist !== null && Math.abs(pctFromResist) <= RESISTANCE_PROXIMITY_PCT) || (pctFromResist !== null && pctFromResist > 0)) {
        result.action = "AVOID / SHORT — At or above resistance with bearish bias";
      } else {
        result.action = "AVOID — Bearish bias";
      }
    } else {
      result.bias = "MIXED";
      result.action = "WAIT — Mixed signals, no clear edge";
    }

    // -- HARD STOP RULES --
    if (pctFromSupport !== null && close < support) {
      result.hardStopTriggered = `⛔ HARD STOP HIT — Close ₹${close.toLocaleString()} below Support ₹${support.toLocaleString()}. Exit ALL long positions immediately.`;
      result.warnings.unshift(result.hardStopTriggered);
      // Ensure bearish points reflect the breach
      bearishPts += 2;
    } else if (pctFromResist !== null && close > resist && !isTrending) {
      // In trending mode, we don't trigger hard stop for shorts because resistance is irrelevant
      result.hardStopTriggered = `⛔ HARD STOP HIT — Close ₹${close.toLocaleString()} above Resistance ₹${resist.toLocaleString()}. Exit ALL short positions immediately.`;
      result.warnings.unshift(result.hardStopTriggered);
      bullishPts += 2;
    }

    // -- BOTTOM LINE --
    const parts = [];
    if (result.marketContext === "TRENDING") {
      parts.push(`Stock is moving strongly in price discovery — ${pctFromSupport?.toFixed(1)}% above Support ₹${support.toLocaleString()}, trading through resistance levels.`);
      const upTargets = [];
      if (result.targets.model && result.targets.model > close) upTargets.push(`Model ₹${result.targets.model.toLocaleString()}`);
      if (balance && balance > close) upTargets.push(`Balance ₹${balance.toLocaleString()}`);
      if (result.targets.pattern) upTargets.push(`Pattern ₹${result.targets.pattern.toLocaleString()}`);

      if (upTargets.length > 0) parts.push(`Upside targets: ${upTargets.join(", ")}.`);

      const downLevels = [];
      if (balance && balance < close) downLevels.push(`Balance ₹${balance.toLocaleString()}`);
      if (result.targets.bearish_pattern) downLevels.push(`Bearish Pattern ₹${result.targets.bearish_pattern.toLocaleString()}`);
      downLevels.push(`Support ₹${support.toLocaleString()}`);
      parts.push(`If momentum fails — downside levels to watch: ${downLevels.join(", ")}. Break of Support ₹${support.toLocaleString()} = immediate exit.`);
    } else {
      if (pctFromResist !== null && pctFromResist > 0 && pctFromResist <= BREAKOUT_PROXIMITY_PCT) {
        parts.push(`Price has broken above Resistance ₹${resist.toLocaleString()}, which now becomes support.`);
      } else if (pctFromResist !== null && Math.abs(pctFromResist) <= RESISTANCE_PROXIMITY_PCT) {
        parts.push(`Price is at Resistance ₹${resist.toLocaleString()} — a poor buy zone.`);
      } else if (pctFromSupport !== null && Math.abs(pctFromSupport) <= SUPPORT_PROXIMITY_PCT) {
        parts.push(`Price is sitting on Support ₹${support.toLocaleString()} — a make-or-break level.`);
      } else if (pctFromSupport !== null && pctFromSupport < 0) {
        parts.push(`Price has broken below Support ₹${support.toLocaleString()} — bearish breakdown.`);
      } else {
        parts.push(`Price is in range between Support ₹${support.toLocaleString()} and Resistance ₹${resist.toLocaleString()}.`);
      }

      if (balance > 0) {
        if (balance > close) parts.push(`Balance at ₹${balance.toLocaleString()} is the first upside target.`);
        else parts.push(`Balance at ₹${balance.toLocaleString()} below price — acts as pullback magnet.`);
      }

      if (result.targets.model) {
        if (result.targets.model > close) parts.push(`Model projects ₹${result.targets.model.toLocaleString()} over 20 days.`);
        else parts.push(`Model is bearish, projecting ₹${result.targets.model.toLocaleString()}.`);
      }

      if (result.targets.pattern) parts.push(`Bullish Pattern target at ₹${result.targets.pattern.toLocaleString()}.`);
      if (result.targets.bearish_pattern) parts.push(`Bearish Pattern target at ₹${result.targets.bearish_pattern.toLocaleString()}.`);
    }

    parts.push(`${result.action}`);
    result.bottomLine = parts.join(" ");

    return result;
  }, [currentStock]);



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

      <Dialog open={showDisclaimer} onOpenChange={setShowDisclaimer}>
        <DialogContent className="sm:max-w-[500px] border-l-4 border-l-orange-500">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Info className="w-5 h-5 text-orange-500" />
              Stock Analysis Disclaimer
            </DialogTitle>
            <DialogDescription className="text-base leading-relaxed pt-4 text-foreground/90 font-medium max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              Stock data shown is algorithmically derived. Trend, support, and resistance levels are analytical observations, not recommendations. This is not SEBI-registered investment advice. Consult a qualified financial advisor before trading.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button onClick={handleAcceptDisclaimer} className="w-full">
              I Understand & Acknowledge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="relative container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-tight">
                STOCKS
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowInfoModal(true)}
                  className="p-2 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 hover:border-primary/40 transition-all duration-200 group"
                  title="Learn about Price Structure & Zone Analysis"
                >
                  <Info className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
                </button>

                <button
                  onClick={() => setShowVideoModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 hover:border-primary/40 transition-all duration-200 group whitespace-nowrap"
                  title="Watch Explanation Video"
                >
                  <PlayCircle className="w-4 h-4 text-primary transition-colors" />
                  <span className="text-[10px] sm:text-xs font-semibold text-primary/90 transition-colors uppercase tracking-wider">Explanation Video</span>
                </button>
                <button
                  onClick={() => setShowVideoModalHindi(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 hover:border-orange-500/40 transition-all duration-200 group whitespace-nowrap"
                  title="हिंदी में देखें"
                >
                  <PlayCircle className="w-4 h-4 text-orange-400 transition-colors" />
                  <span className="text-[10px] sm:text-xs font-semibold text-orange-400/90 transition-colors uppercase tracking-wider">हिंदी Video</span>
                </button>
              </div>
            </div>
            <p className="text-muted-foreground text-sm md:text-base">Historical charts and data from lasa-master</p>
          </div>
          <div className="flex flex-col md:items-end">
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
                  {searchSuggestions.map((stock, index) => {
                    // Custom trend calculation based on Support/Resistance slopes
                    let trendLabel = stock.trend;
                    const history = stock.history || [];

                    if (history.length >= 5) {
                      const latest = history[history.length - 1];
                      const prev = history[history.length - 5];

                      // Logic: support increasing (uptrend) or resistance decreasing (downtrend)
                      const isSupportIncreasing = latest.support > prev.support;
                      const isResistanceDecreasing = latest.resistance < prev.resistance;

                      if (isSupportIncreasing) {
                        trendLabel = "UPTREND";
                      } else if (isResistanceDecreasing) {
                        trendLabel = "DOWNTREND";
                      } else {
                        trendLabel = "NEUTRAL";
                      }
                    }

                    return (
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
                          <p className={`text-[10px] font-bold tracking-wider ${trendLabel === 'UPTREND' ? 'text-success' : trendLabel === 'DOWNTREND' ? 'text-destructive' : 'text-warning'}`}>
                            {trendLabel}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Stock Selector */}
            <Select value={selectedStock} onValueChange={(val) => setSearchParams({ symbol: val })}>
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

        <div className="glass-card mb-6 animate-fade-in-up-delay-1 p-2.5 md:p-3">
          <div className="flex flex-col lg:flex-row items-stretch gap-4">
            {/* 1. Primary Price Stats (Left) — NASA HUD Panel */}
            <div className="lg:w-[32%] shrink-0 relative flex flex-col items-center justify-center text-center rounded-xl overflow-hidden p-3" style={{ background: 'linear-gradient(135deg, rgba(0,8,20,0.95) 0%, rgba(0,15,35,0.9) 100%)' }}>
              {/* Technical grid overlay */}
              <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(99,179,237,1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,179,237,1) 1px, transparent 1px)', backgroundSize: '15px 15px' }} />

              {/* Scan line animation */}
              <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent animate-[scan_3s_ease-in-out_infinite]" style={{ top: '50%' }} />

              {/* HUD Corner Brackets */}
              <div className="absolute top-1.5 left-1.5 w-4 h-4 border-t-2 border-l-2 border-cyan-500/60 rounded-tl" />
              <div className="absolute top-1.5 right-1.5 w-4 h-4 border-t-2 border-r-2 border-cyan-500/60 rounded-tr" />
              <div className="absolute bottom-1.5 left-1.5 w-4 h-4 border-b-2 border-l-2 border-cyan-500/60 rounded-bl" />
              <div className="absolute bottom-1.5 right-1.5 w-4 h-4 border-b-2 border-r-2 border-cyan-500/60 rounded-br" />

              {/* Content */}
              <div className="relative z-10 space-y-1.5 w-full">
                {/* System ID line */}
                <div className="flex items-center justify-center gap-1.5">
                  <div className="h-0.5 w-0.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="font-mono text-[8px] font-bold text-cyan-400/70 uppercase tracking-[0.2em]">SYS.LIVE</span>
                  <div className="h-0.5 w-0.5 rounded-full bg-cyan-400 animate-pulse" />
                </div>

                {/* Symbol + Date */}
                <div className="space-y-0">
                  <div className="font-mono text-[10px] font-black text-cyan-300/80 uppercase tracking-widest">
                    {currentStock?.symbol}
                  </div>
                  <div className="font-mono text-[8px] text-cyan-500/40 tracking-widest uppercase">
                    {analysisResult?.date}
                  </div>
                </div>

                {/* Hero Price */}
                <div className="relative">
                  <div className="font-mono text-[32px] leading-tight font-black text-white tracking-tight drop-shadow-[0_0_15px_rgba(99,179,237,0.3)]">
                    ₹{currentStock?.price?.toLocaleString()}
                  </div>
                  <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-12 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
                </div>

                {/* RSI + Trend Badges */}
                <div className="flex items-center justify-center gap-1.5 pt-0.5">
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-sm bg-cyan-500/10 border border-cyan-500/25 backdrop-blur-sm">
                    <Activity className="w-2.5 h-2.5 text-cyan-400" />
                    <span className="font-mono text-[9px] font-black text-cyan-400 tracking-wider">RSI:{currentStock?.rsi?.toFixed(0)}</span>
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-sm border backdrop-blur-sm ${calculatedTrend === 'UPTREND'
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                    }`}>
                    {calculatedTrend === 'UPTREND'
                      ? <TrendingUp className="w-2.5 h-2.5 text-emerald-400" />
                      : <TrendingDown className="w-2.5 h-2.5 text-red-400" />
                    }
                    <span className={`font-mono text-[9px] font-black tracking-wider ${calculatedTrend === 'UPTREND' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {calculatedTrend}
                    </span>
                  </div>
                </div>

                {/* Sector readout */}
                <div className="pt-0.5 border-t border-cyan-500/10">
                  <span className="font-mono text-[7px] text-cyan-500/35 uppercase tracking-[0.1em]">
                    ◈ SEC/{currentStock?.sector?.replace('NIFTY-', '')}
                  </span>
                </div>
              </div>
            </div>



            {/* 2. Strategist Intel (Right) */}
            {analysisResult && (
              <div className="flex-1 min-w-0">
                <PremiumProtector
                  isLocked={isDailyLimitReached}
                  title="Daily Limit Reached"
                  description="Upgrade to PRO for unlimited stock analysis."
                >
                  <div className="relative overflow-hidden group rounded-xl border border-primary/10 bg-black/20 p-2 space-y-1">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-0">
                      <div className="flex items-center gap-1">
                        <div className="p-0.5 px-1 rounded bg-primary/20 border border-primary/30 text-[8px] font-black text-primary uppercase tracking-wider">Strategist Report</div>
                        <div className={`h-0.5 w-0.5 rounded-full animate-pulse ${analysisResult.bias === 'BULLISH' ? 'bg-success' : 'bg-destructive'}`} />
                      </div>
                      <div className="text-[8px] font-bold text-muted-foreground/20 uppercase tracking-widest leading-none">LASA INTEL</div>
                    </div>

                    {/* Sub-header */}
                    <div className="text-[7.5px] font-bold text-muted-foreground/30 uppercase tracking-[0.15em]">Upside Targets &middot; Confidence Ranked</div>

                    {/* HIGH CONFIDENCE */}
                    {(analysisResult.resistance > 0 || analysisResult.targets.balance > 0) && (
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1">
                          <div className="h-px flex-1 bg-success/20" />
                          <span className="text-[7px] font-black text-success/50 uppercase tracking-widest">High Confidence</span>
                          <div className="h-px flex-1 bg-success/20" />
                        </div>
                        {analysisResult.resistance > 0 && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <div className="h-1 w-1 rounded-full bg-success shadow-[0_0_4px_rgba(34,197,94,0.7)] shrink-0" />
                              <span className="text-[10px] font-semibold text-foreground/90">Resistance</span>
                              <div className="flex items-center gap-1 px-1 py-0 rounded bg-success/10 border border-success/20">
                                <span className="text-[7px] text-success font-black tracking-tight">|||</span>
                                <span className="text-[6.5px] font-black text-success uppercase tracking-wide">HIGH</span>
                              </div>
                            </div>
                            <span className="text-[11px] font-bold font-mono text-success">₹{analysisResult.resistance.toLocaleString()}</span>
                          </div>
                        )}
                        {analysisResult.targets.balance > 0 && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <div className="h-1 w-1 rounded-full bg-success shadow-[0_0_4px_rgba(34,197,94,0.7)] shrink-0" />
                              <span className="text-[10px] font-semibold text-foreground/90">Balance</span>
                              <div className="flex items-center gap-1 px-1 py-0 rounded bg-success/10 border border-success/20">
                                <span className="text-[7px] text-success font-black tracking-tight">|||</span>
                                <span className="text-[6.5px] font-black text-success uppercase tracking-wide">HIGH</span>
                              </div>
                            </div>
                            <span className="text-[11px] font-bold font-mono text-success">₹{analysisResult.targets.balance.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* MODERATE CONFIDENCE */}
                    {analysisResult.targets.model > 0 && (
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1">
                          <div className="h-px flex-1 bg-warning/20" />
                          <span className="text-[7px] font-black text-warning/50 uppercase tracking-widest">Moderate Confidence</span>
                          <div className="h-px flex-1 bg-warning/20" />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div className="h-1 w-1 rounded-full bg-warning shadow-[0_0_4px_rgba(234,179,8,0.7)] shrink-0" />
                            <span className="text-[10px] font-semibold text-foreground/90">Model Target</span>
                            <div className="flex items-center gap-1 px-1 py-0 rounded bg-warning/10 border border-warning/20">
                              <span className="text-[7px] text-warning font-black tracking-tight">||</span>
                              <span className="text-[6.5px] font-black text-warning uppercase tracking-wide">MODERATE</span>
                            </div>
                          </div>
                          <span className="text-[11px] font-bold font-mono text-warning">₹{analysisResult.targets.model.toLocaleString()}</span>
                        </div>
                      </div>
                    )}

                    {/* SPECULATIVE */}
                    {analysisResult.targets.pattern > 0 && (
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1">
                          <div className="h-px flex-1 bg-primary/20" />
                          <span className="text-[7px] font-black text-primary/50 uppercase tracking-widest">Speculative</span>
                          <div className="h-px flex-1 bg-primary/20" />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div className="h-1 w-1 rounded-full bg-primary shadow-[0_0_4px_rgba(99,102,241,0.7)] shrink-0" />
                            <span className="text-[10px] font-semibold text-foreground/90">Pattern Target</span>
                            <div className="flex items-center gap-1 px-1 py-0 rounded bg-primary/10 border border-primary/20">
                              <span className="text-[7px] text-primary font-black">|</span>
                              <span className="text-[6.5px] font-black text-primary uppercase tracking-wide">SPECULATIVE</span>
                            </div>
                          </div>
                          <span className="text-[11px] font-bold font-mono text-primary">₹{analysisResult.targets.pattern.toLocaleString()}</span>
                        </div>
                      </div>
                    )}

                    {/* Support Floor */}
                    <div className="pt-0.5 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="h-1 w-1 rounded-full bg-destructive shadow-[0_0_4px_rgba(239,68,68,0.7)] shrink-0" />
                        <span className="text-[10px] font-semibold text-destructive/90">Support (Floor)</span>
                      </div>
                      <span className="text-[11px] font-bold font-mono text-destructive">₹{analysisResult.support.toLocaleString()}</span>
                    </div>

                    {/* Footer Alerts */}
                    <div className="space-y-0.5 pt-0">
                      <div className="p-1 rounded-lg bg-primary/5 border border-primary/10 flex items-center gap-1.5">
                        <Info className="w-2.5 h-2.5 text-primary shrink-0" />
                        <p className="text-[8px] text-muted-foreground/80 leading-tight">Higher targets carry lower probability in near term.</p>
                      </div>
                      {analysisResult.support > 0 && (
                        <div className="p-1 rounded-lg bg-destructive/5 border border-destructive/10 flex items-center gap-1.5">
                          <X className="w-2.5 h-2.5 text-destructive shrink-0" />
                          <p className="text-[8px] text-destructive/80 leading-tight">
                            If <span className="font-bold text-destructive">₹{analysisResult.support.toLocaleString()}</span> breaks, upside is invalidated.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </PremiumProtector>
              </div>
            )}
          </div>
        </div>


        {/* Chart */}
        <div className="mb-6 animate-fade-in-up-delay-2">
          <StockPriceChart data={chartData} onHover={setHoveredChartData} symbol={currentStock?.symbol} />
        </div>

        {/* TradingView Technical Analysis Widget */}
        <div className="mb-6 animate-fade-in-up-delay-2 rounded-xl overflow-hidden border-none TV-widget-wrapper">
          <PremiumProtector requiredTier="pro">
            <TechnicalAnalysisWidget symbol={`NSE:${currentStock?.symbol}`} height={600} />
          </PremiumProtector>
        </div>

        {/* Data Table */}
        <div className="animate-fade-in-up-delay-3">
          <StockStrengthZone data={chartData} />
        </div>
      </div >

      {/* Info Modal */}
      {
        showInfoModal && (
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
                    <li><span className="text-primary font-medium">Model</span> – derived from machine-learning models</li>
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
        )
      }

      {/* Video Modal */}
      {
        showVideoModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setShowVideoModal(false)}
          >
            <div
              className="relative w-full max-w-4xl bg-background/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <PlayCircle className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">Analysis Explanation</h3>
                </div>
                <button
                  onClick={() => setShowVideoModal(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <div className="w-full aspect-video bg-black">
                <iframe
                  src="https://www.youtube.com/embed/T5jFDlEbL_M?autoplay=1"
                  title="Analysis Explanation Video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>

              <div className="p-4 bg-primary/5 border-t border-white/10">
                <p className="text-sm text-muted-foreground text-center italic">
                  Learn how to interpret our algorithmic price structures and trading zones.
                </p>
              </div>
            </div>
          </div>
        )
      }

      {/* Stock Analysis Hindi Video Modal */}
      {
        showVideoModalHindi && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setShowVideoModalHindi(false)}
          >
            <div
              className="relative w-full max-w-4xl bg-background/95 backdrop-blur-xl border border-orange-500/20 rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <PlayCircle className="w-5 h-5 text-orange-400" />
                  <h3 className="text-lg font-semibold text-foreground">Stock Analysis — हिंदी में</h3>
                </div>
                <button
                  onClick={() => setShowVideoModalHindi(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <div className="w-full aspect-video bg-black">
                <iframe
                  src="https://www.youtube.com/embed/qOEfpC_Ctyo?autoplay=1"
                  title="Stock Analysis Hindi Explanation Video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
              <div className="p-4 bg-orange-500/5 border-t border-white/10">
                <p className="text-sm text-muted-foreground text-center italic">
                  स्टॉक एनालिसिस और प्राइस ज़ोन को हिंदी में समझें।
                </p>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default StockAnalysis;
