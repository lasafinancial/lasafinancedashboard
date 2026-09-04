import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLiveData } from "@/hooks/useLiveData";
import { Clock, Timer, TrendingUp, CandlestickChart, ChevronRight, BarChart2, Sparkles, Layers } from "lucide-react";

export function LiveCallsGrid() {
  const navigate = useNavigate();
  const { weeklyRecommendation, exitTargetScreener, intradayBreakout, niftyAnalysis } = useLiveData();

  // 1. Long Term Stocks (weekly recommendation in column AQ status = OPEN)
  const longTermCount = useMemo(() => {
    return (weeklyRecommendation || []).filter(
      (item) => (item.status || "").trim().toUpperCase() === "OPEN"
    ).length;
  }, [weeklyRecommendation]);

  // 2. Short Term Stocks (recommendation in column Q status = OPEN)
  const shortTermCount = useMemo(() => {
    return (exitTargetScreener || []).filter(
      (item) => (item.status || "").trim().toUpperCase() === "OPEN"
    ).length;
  }, [exitTargetScreener]);

  // 3. Intraday Stocks (intraday breakout calls)
  const intradayCount = useMemo(() => {
    return (intradayBreakout || []).length;
  }, [intradayBreakout]);

  // 4. Futures & Options (Nifty / F&O analysis signals)
  const foCount = useMemo(() => {
    if (niftyAnalysis?.history && niftyAnalysis.history.length > 0) {
      return niftyAnalysis.history.length;
    }
    return 3;
  }, [niftyAnalysis]);

  const cards = [
    {
      id: "long-term",
      title: "Positional Trades",
      subtitle: "Holding 2–6 Months",
      count: `${longTermCount} Calls`,
      route: "/screeners/weekly-recommendations",
      icon: <Clock className="w-6 h-6 text-blue-400" />,
      iconBg: "bg-blue-500/10 border-blue-500/20 shadow-blue-500/10",
      hoverBorder: "hover:border-blue-500/40 hover:shadow-blue-500/5",
      glowColor: "from-blue-500/10 to-transparent"
    },
    {
      id: "short-term",
      title: "Short Term Trades",
      subtitle: "Holding 1–4 Weeks",
      count: `${shortTermCount} Calls`,
      route: "/screeners/recommendations",
      icon: <Timer className="w-6 h-6 text-emerald-400" />,
      iconBg: "bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/10",
      hoverBorder: "hover:border-emerald-500/40 hover:shadow-emerald-500/5",
      glowColor: "from-emerald-500/10 to-transparent"
    },
    {
      id: "intraday",
      title: "Intraday Stocks",
      count: `${intradayCount} Calls`,
      route: "/screeners/intraday-breakout",
      icon: <TrendingUp className="w-6 h-6 text-amber-400" />,
      iconBg: "bg-amber-500/10 border-amber-500/20 shadow-amber-500/10",
      hoverBorder: "hover:border-amber-500/40 hover:shadow-amber-500/5",
      glowColor: "from-amber-500/10 to-transparent"
    },
    {
      id: "fo",
      title: "Futures & Options",
      count: `${foCount} Calls`,
      route: "/screeners/nifty-analysis",
      icon: <Layers className="w-6 h-6 text-purple-400" />,
      iconBg: "bg-purple-500/10 border-purple-500/20 shadow-purple-500/10",
      hoverBorder: "hover:border-purple-500/40 hover:shadow-purple-500/5",
      glowColor: "from-purple-500/10 to-transparent"
    }
  ];

  return (
    <div className="w-full mb-10 space-y-4">
      {/* Header Row */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <div className="absolute w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping opacity-75" />
          </div>
          <h2 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
            Live Calls
          </h2>
        </div>

        <button
          onClick={() => navigate("/screeners")}
          className="group flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-primary transition-colors cursor-pointer"
        >
          <span>View All</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* 4 Call Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((card) => (
          <div
            key={card.id}
            onClick={() => navigate(card.route)}
            className={`group relative overflow-hidden bg-[#0b0f19]/90 border border-white/10 ${card.hoverBorder} rounded-2xl p-3.5 sm:p-5 transition-all duration-200 hover:-translate-y-1 active:scale-[0.98] hover:shadow-xl cursor-pointer backdrop-blur-md flex flex-col items-center text-center justify-between min-h-[135px] sm:min-h-[160px] shadow-lg`}
          >
            {/* Top Ambient Gradient */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.glowColor}`} />

            {/* Icon Bubble */}
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl ${card.iconBg} border flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shrink-0 shadow-md`}>
              {card.icon}
            </div>

            {/* Title & Calls Count */}
            <div className="space-y-1 mt-3 w-full">
              <h3 className="text-xs sm:text-sm font-black text-white tracking-tight group-hover:text-primary transition-colors line-clamp-1">
                {card.title}
              </h3>
              {"subtitle" in card && (
                <p className="text-[10px] text-muted-foreground/70 font-semibold tracking-tight">
                  {(card as any).subtitle}
                </p>
              )}
              <p className="text-[11px] sm:text-xs font-mono font-bold text-muted-foreground">
                {card.count}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LiveCallsGrid;
