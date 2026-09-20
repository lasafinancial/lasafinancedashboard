import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from "lucide-react";
import { useLiveData } from "@/hooks/useLiveData";
import { PremiumProtector } from "@/components/ui/PremiumProtector";
import type { WeeklyRecommendationItem } from "@/lib/googleSheetsService";

const RECENT_COUNT = 5;

// Same date handling as the Positional Trades screener
function parseDateValue(dateStr: string): number {
  if (!dateStr || !dateStr.trim()) return 0;
  const str = dateStr.trim();
  const parsed = Date.parse(str);
  if (!isNaN(parsed) && parsed > 0) return parsed;

  const parts = str.split(/[-/]/);
  if (parts.length === 3) {
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const y = parseInt(parts[2], 10);
    if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
      return new Date(y < 100 ? 2000 + y : y, m, d).getTime();
    }
  }
  return 0;
}

function parseNumber(val: string | undefined | null): number {
  if (val === undefined || val === null) return 0;
  const num = parseFloat(val.toString().replace(/,/g, "").replace(/%/g, "").trim());
  return isNaN(num) ? 0 : num;
}

/** Return % exactly as the sheet gives it, formatted like the screener's badge. */
function ReturnBadge({ profit }: { profit: string | undefined }) {
  if (!profit || profit === "—" || profit.trim() === "") {
    return (
      <div className="text-right shrink-0">
        <span className="text-sm font-black text-white/50">—</span>
        <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Returns</div>
      </div>
    );
  }
  const num = parseNumber(profit);
  const isPos = num > 0;
  const isNeg = num < 0;
  return (
    <div className="text-right shrink-0">
      <div className={`flex items-center justify-end gap-1 text-sm font-black tracking-tight ${isPos ? "text-emerald-400" : isNeg ? "text-rose-400" : "text-white/80"}`}>
        {isPos && <TrendingUp className="w-3.5 h-3.5" />}
        {isNeg && <TrendingDown className="w-3.5 h-3.5" />}
        <span>{isPos ? `+${num.toFixed(1)}%` : `${num.toFixed(1)}%`}</span>
      </div>
      <div className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Returns</div>
    </div>
  );
}

/**
 * Horizontally scrolling strip of the most recent OPEN Positional Trades
 * (weeklyRecommendation, status OPEN), newest first. Shown above Live Calls.
 */
export function RecentPositionalStrip() {
  const navigate = useNavigate();
  const { weeklyRecommendation } = useLiveData();

  const recent = useMemo(() => {
    return (weeklyRecommendation || [])
      .map((item, idx) => ({ item, idx, time: parseDateValue(item.date || item.entryDate) }))
      .filter(({ item }) => (item.status || "").trim().toUpperCase() === "OPEN")
      // newest date first; on the same date the later row in the sheet counts as more recent
      .sort((a, b) => b.time - a.time || b.idx - a.idx)
      .slice(0, RECENT_COUNT)
      .map(({ item }) => item);
  }, [weeklyRecommendation]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateArrows();
    window.addEventListener("resize", updateArrows);
    return () => window.removeEventListener("resize", updateArrows);
  }, [recent.length]);

  const scrollByTiles = (direction: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.max(240, el.clientWidth * 0.8), behavior: "smooth" });
  };

  if (recent.length === 0) return null;

  const openPositional = () => navigate("/screeners/weekly-recommendations");

  return (
    <div className="w-full mb-8 space-y-3">
      {/* Header Row */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
            <div className="absolute w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping opacity-75" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight text-white leading-tight">
              Latest Positional Trades
            </h2>
            <p className="text-[11px] text-muted-foreground/70 font-semibold">
              Last {recent.length} open {recent.length === 1 ? "trade" : "trades"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            aria-label="Scroll left"
            onClick={() => scrollByTiles(-1)}
            disabled={!canScrollLeft}
            className="hidden sm:flex w-7 h-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Scroll right"
            onClick={() => scrollByTiles(1)}
            disabled={!canScrollRight}
            className="hidden sm:flex w-7 h-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={openPositional}
            className="group flex items-center gap-1 ml-1 text-xs font-bold text-muted-foreground hover:text-primary transition-colors cursor-pointer"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Scrolling tiles */}
      <PremiumProtector requiredTier="pro" blurLevel="md">
        <div
          ref={scrollRef}
          onScroll={updateArrows}
          className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {recent.map((item: WeeklyRecommendationItem, idx) => {
            const initials = item.id.slice(0, 2).toUpperCase();
            const initiated = item.entryDate || item.date;

            return (
              <button
                type="button"
                key={`${item.id}-${initiated}-${idx}`}
                onClick={openPositional}
                className="group snap-start shrink-0 w-[236px] sm:w-[260px] text-left bg-[#0b0f19]/90 border border-white/10 hover:border-cyan-400/40 rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan-500/5 active:scale-[0.98] backdrop-blur-md"
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/15 flex items-center justify-center font-black text-xs text-white shrink-0 shadow-inner group-hover:border-cyan-400/50 transition-colors">
                      {initials}
                    </div>
                    <h3 className="text-sm font-black text-white tracking-tight truncate min-w-0 group-hover:text-cyan-300 transition-colors">
                      {item.id}
                    </h3>
                  </div>
                  <ReturnBadge profit={item.profit} />
                </div>

                <div className="grid grid-cols-2 gap-2 py-2 px-2.5 rounded-xl bg-white/[0.02] border border-white/5 mb-2.5 text-xs">
                  <div>
                    <div className="text-[9px] text-muted-foreground font-semibold uppercase">Buy Price</div>
                    <div className="font-mono font-bold text-blue-300 truncate">{item.buyPrice ? `₹${item.buyPrice}` : "—"}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] text-muted-foreground font-semibold uppercase">Current</div>
                    <div className="font-mono font-bold text-cyan-300 truncate">{item.currentPrice ? `₹${item.currentPrice}` : "—"}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 text-[10px]">
                  <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-bold">
                    Positional
                  </span>
                  <span className="font-mono text-muted-foreground truncate">
                    Initiated: <strong className="text-blue-300 font-bold">{initiated || "—"}</strong>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </PremiumProtector>
    </div>
  );
}

export default RecentPositionalStrip;
