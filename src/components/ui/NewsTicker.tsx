import { useLiveData } from "@/hooks/useLiveData";
import { useMemo } from "react";
import { Sparkles, TrendingUp } from "lucide-react";

const FALLBACK_TICKER = [
  "AUG LAST WEEK BOOKED 10% PROFIT IN THREE STOCKS",
  "BEML HIT 10%",
  "CYIENT HIT 10%",
  "IDBI HIT 10%",
  "HIT 50% PROFIT IN THREE STOCKS",
  "PGIL HIT 50%",
  "TNPETRO HIT 47%",
  "WELSPUNLIV HIT 50%",
  "CGCL HIT 50%"
];

export function NewsTicker() {
  const { tickerTape } = useLiveData();

  const items = useMemo(() => {
    if (tickerTape && Array.isArray(tickerTape) && tickerTape.length > 0) {
      return tickerTape.filter(item => typeof item === 'string' && item.trim().length > 0);
    }
    return FALLBACK_TICKER;
  }, [tickerTape]);

  return (
    <div className="w-full relative z-30 mb-4 sm:mb-6">
      <div className="w-full relative bg-card/60 border border-primary/20 rounded-xl sm:rounded-2xl overflow-hidden shadow-lg backdrop-blur-md flex items-center h-10 sm:h-11">
        {/* Left Badge */}
        <div className="absolute left-0 z-20 h-full flex items-center bg-background/95 border-r border-border px-2.5 sm:px-3.5 shadow-[4px_0_12px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[11px] sm:text-xs font-bold text-foreground tracking-wider uppercase whitespace-nowrap flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-primary hidden sm:inline" />
              Ticker
            </span>
          </div>
        </div>

        {/* Marquee Track Container */}
        <div className="flex-1 overflow-hidden h-full relative pl-[75px] sm:pl-[105px]">
          {/* Gradient Edge Masks */}
          <div className="absolute left-[75px] sm:left-[105px] top-0 w-8 h-full bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 w-10 sm:w-16 h-full bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

          {/* Scrolling Items */}
          <div className="flex items-center h-full w-max animate-marquee hover:[animation-play-state:paused]">
            {/* Primary Track */}
            <div className="flex shrink-0 items-center">
              {items.map((text, idx) => {
                const hasProfit = /profit|hit\s+\d+%/i.test(text);
                return (
                  <div key={idx} className="flex items-center mx-3 sm:mx-4 group select-none">
                    {hasProfit && (
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400 mr-1.5 shrink-0" />
                    )}
                    <span className="text-xs sm:text-sm font-semibold tracking-wide text-foreground/90 group-hover:text-primary transition-colors whitespace-nowrap">
                      {text}
                    </span>
                    <span className="mx-4 sm:mx-6 text-primary/40 font-bold">•</span>
                  </div>
                );
              })}
            </div>

            {/* Duplicate Track for Continuous Loop */}
            <div className="flex shrink-0 items-center">
              {items.map((text, idx) => {
                const hasProfit = /profit|hit\s+\d+%/i.test(text);
                return (
                  <div key={`dup-${idx}`} className="flex items-center mx-3 sm:mx-4 group select-none">
                    {hasProfit && (
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400 mr-1.5 shrink-0" />
                    )}
                    <span className="text-xs sm:text-sm font-semibold tracking-wide text-foreground/90 group-hover:text-primary transition-colors whitespace-nowrap">
                      {text}
                    </span>
                    <span className="mx-4 sm:mx-6 text-primary/40 font-bold">•</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
