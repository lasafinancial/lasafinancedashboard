import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useLiveData } from "@/hooks/useLiveData";
import { PremiumProtector } from "@/components/ui/PremiumProtector";
import { MarqueeRow } from "@/components/ui/MarqueeRow";
import type { WeeklyRecommendationItem } from "@/lib/googleSheetsService";

const RECENT_COUNT = 5;
const MARQUEE_SPEED = 20; // px per second, the same pace as the ticker above (which moves ~20 px/s)

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

/** Potential exactly as the sheet gives it (column AU); a "%" is added only if the cell has none. */
function potentialLabel(raw: string | undefined): string {
  const v = (raw ?? "").trim();
  if (!v) return "—";
  return v.includes("%") ? v : `${v}%`;
}

/**
 * Continuously scrolling strip (like the ticker above it) of the most recent OPEN
 * Positional Trades (weeklyRecommendation, status OPEN), newest first. Shown above Live Calls.
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

  if (recent.length === 0) return null;

  const openPositional = () => navigate("/screeners/weekly-recommendations");

  return (
    <div className="w-full mb-8">
      <MarqueeRow<WeeklyRecommendationItem>
        items={recent}
        getKey={(item, idx) => `${item.id}-${item.entryDate || item.date}-${idx}`}
        speed={MARQUEE_SPEED}
        header={
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
        }
        trailing={
          <button
            type="button"
            onClick={openPositional}
            className="group flex items-center gap-1 ml-1 text-xs font-bold text-muted-foreground hover:text-primary transition-colors cursor-pointer"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        }
        wrapRow={(row) => (
          <PremiumProtector requiredTier="pro" blurLevel="md">
            {row}
          </PremiumProtector>
        )}
        renderItem={(item, { decoy }) => {
          const initials = item.id.slice(0, 2).toUpperCase();
          const initiated = item.entryDate || item.date;

          return (
            <button
              type="button"
              tabIndex={decoy ? -1 : 0}
              onClick={openPositional}
              className="group shrink-0 w-[236px] sm:w-[260px] min-h-[163px] text-left bg-[#0b0f19]/90 border border-white/10 hover:border-cyan-400/40 rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan-500/5 active:scale-[0.98] backdrop-blur-md"
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
              </div>

              <div className="flex items-center justify-between gap-2 py-2 px-2.5 rounded-xl bg-white/[0.02] border border-white/5 mb-2.5 text-xs">
                <div className="text-[9px] text-muted-foreground font-semibold uppercase">Potential</div>
                <div className="font-mono font-bold text-emerald-400 truncate">{potentialLabel(item.potential)}</div>
              </div>

              <div className="space-y-1 text-[10px] font-mono text-muted-foreground">
                <div className="truncate">
                  Initiated: <strong className="text-blue-300 font-bold">{initiated || "—"}</strong>
                </div>
                <div className="truncate">
                  Period: <strong className="text-white/90 font-bold">upto 1 year</strong>
                </div>
              </div>
            </button>
          );
        }}
      />
    </div>
  );
}

export default RecentPositionalStrip;
