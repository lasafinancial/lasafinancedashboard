import { useMemo, useState } from "react";
import { Crosshair, TrendingUp, TrendingDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ExitTargetScreenerItem } from "@/lib/googleSheetsService";
import { TradeRangeBar, parseSheetNumber } from "@/components/cards/TradeRangeBar";

/**
 * Preview only: hardcoded sample data, not linked from anywhere.
 * The card markup mirrors the Short Term Trades card in pages/ExitTargetScreener.tsx.
 * Tickers and prices below are fictional.
 */

type SortField = "date" | "profit" | "riskReward" | "id";

// stoploss = sheet col V, rangeTarget = L, currentPrice = Y,
// potentialLeft = AB, stoplossDistance = AC, riskReward = AD (all hardcoded here as sample cells).
const SAMPLE_ITEMS: ExitTargetScreenerItem[] = [
  // Normal: marker mid-range
  {
    id: "ACMEPOWER", date: "12 Sep 2026", buyPrice: "1250", currentPrice: "1330", targetPrice: "1430",
    stoploss: "1175", rangeTarget: "1430", potentialLeft: "8", stoplossDistance: "11.65", riskReward: "0.65",
    profit: "6.4", status: "OPEN", reason: "", exitDate: "", holdingDays: "8",
  },
  // Near target: marker close to the right end
  {
    id: "NOVABANK", date: "08 Sep 2026", buyPrice: "840", currentPrice: "951", targetPrice: "966",
    stoploss: "798", rangeTarget: "966", potentialLeft: "2", stoplossDistance: "16.09", riskReward: "0.10",
    profit: "13.2", status: "OPEN", reason: "", exitDate: "", holdingDays: "12",
  },
  // Price below stoploss: marker held at the left end, sheet gives negative distance / ratio
  {
    id: "ZENITHPHARMA", date: "15 Sep 2026", buyPrice: "512", currentPrice: "471", targetPrice: "560",
    stoploss: "480", rangeTarget: "560", potentialLeft: "19", stoplossDistance: "-1.91", riskReward: "-9.89",
    profit: "-8.0", status: "OPEN", reason: "", exitDate: "", holdingDays: "5",
  },
  // Current price and AB/AC/AD blank in the sheet: bar only, no marker, no labels
  {
    id: "ORIONAUTO", date: "03 Sep 2026", buyPrice: "2210", targetPrice: "2430",
    stoploss: "2100", rangeTarget: "2430", potentialLeft: "", stoplossDistance: "", riskReward: "",
    profit: "", status: "OPEN", reason: "", exitDate: "", holdingDays: "17",
  },
];

const COMPANY_NAMES: Record<string, string> = {
  ACMEPOWER: "Acme Power & Infrastructure Ltd",
  NOVABANK: "Nova Bank Ltd",
  ZENITHPHARMA: "Zenith Pharmaceuticals Ltd",
  ORIONAUTO: "Orion Automotive Components Ltd",
};

function parseDateValue(dateStr: string): number {
  const parsed = Date.parse((dateStr || "").trim());
  return isNaN(parsed) ? 0 : parsed;
}

function parseNumber(val: string | undefined): number {
  const num = parseFloat((val ?? "").replace(/,/g, "").replace(/%/g, "").trim());
  return isNaN(num) ? 0 : num;
}

const renderReturnBadge = (profitStr: string | undefined) => {
  if (!profitStr || profitStr.trim() === "") {
    return (
      <div className="text-right">
        <span className="text-sm font-black text-white/50">—</span>
        <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Returns</div>
      </div>
    );
  }
  const num = parseNumber(profitStr);
  const isPos = num > 0;
  const isNeg = num < 0;
  return (
    <div className="text-right">
      <div className={`flex items-center justify-end gap-1 text-sm font-black tracking-tight ${isPos ? "text-emerald-400" : isNeg ? "text-rose-400" : "text-white/80"}`}>
        {isPos && <TrendingUp className="w-3.5 h-3.5" />}
        {isNeg && <TrendingDown className="w-3.5 h-3.5" />}
        <span>{isPos ? `+${num.toFixed(1)}%` : `${num.toFixed(1)}%`}</span>
      </div>
      <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Returns</div>
    </div>
  );
};

const ONGOING_STATUS = {
  label: "Ongoing Trade",
  badgeClass: "border-indigo-500/30 bg-indigo-500/10 text-indigo-300",
  icon: <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />,
};

export default function TradeBarPreview() {
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection(field === "date" || field === "profit" || field === "riskReward" ? "desc" : "asc");
    }
  };

  const items = useMemo(() => {
    const dir = sortDirection === "asc" ? 1 : -1;
    return [...SAMPLE_ITEMS].sort((a, b) => {
      if (sortField === "date") return dir * (parseDateValue(a.date) - parseDateValue(b.date));
      if (sortField === "profit") return dir * (parseNumber(a.profit) - parseNumber(b.profit));
      if (sortField === "riskReward") {
        const rA = parseSheetNumber(a.riskReward);
        const rB = parseSheetNumber(b.riskReward);
        // Trades with no ratio in the sheet always sink to the bottom
        if (rA === null && rB === null) return 0;
        if (rA === null) return 1;
        if (rB === null) return -1;
        return dir * (rA - rB);
      }
      return dir * a.id.localeCompare(b.id);
    });
  }, [sortField, sortDirection]);

  const sortButton = (field: SortField, label: string) => (
    <Button
      variant="outline"
      size="sm"
      onClick={() => toggleSort(field)}
      className={`h-8 px-2.5 text-[11px] rounded-lg border-white/10 ${sortField === field ? "bg-amber-500/15 text-amber-300 border-amber-500/30 font-bold" : "bg-white/5 text-white/70"}`}
    >
      {label} {sortField === field && (sortDirection === "desc" ? "▾" : "▴")}
    </Button>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-foreground selection:bg-primary/30 font-sans pb-16">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      <div className="relative container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <div className="px-3 py-2 rounded-lg border border-dashed border-amber-400/40 bg-amber-500/5 text-[11px] font-bold text-amber-300 uppercase tracking-wider">
          Preview · hardcoded sample data · fictional tickers · not a real recommendation
        </div>

        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black uppercase tracking-widest mb-1.5">
            <Crosshair className="w-3.5 h-3.5" />
            Short Term Swing Trades
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase">
            SHORT TERM <span className="gradient-text italic font-bold">TRADES</span>
          </h1>
          <p className="text-xs text-muted-foreground font-semibold mt-1">Holding 1–4 Weeks</p>
        </div>

        {/* Sort row (Risk:Reward added next to Returns) */}
        <div className="flex items-center gap-2 justify-between sm:justify-end">
          <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">Sort:</span>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {sortButton("date", "Date")}
            {sortButton("profit", "Returns")}
            {sortButton("riskReward", "Risk:Reward")}
            {sortButton("id", "Symbol")}
          </div>
        </div>

        <div className="space-y-3.5">
          {items.map(item => {
            const companyName = COMPANY_NAMES[item.id] ?? item.id;
            const initials = item.id.slice(0, 2).toUpperCase();

            return (
              <div
                key={item.id}
                className="group relative bg-[#0b0f19]/90 border border-white/10 hover:border-amber-400/40 rounded-2xl p-4 md:p-5 transition-all duration-200 hover:shadow-xl hover:shadow-amber-500/5 backdrop-blur-md"
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold tracking-wide ${ONGOING_STATUS.badgeClass}`}>
                    {ONGOING_STATUS.icon}
                    <span>{ONGOING_STATUS.label}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-amber-400 transition-colors">
                    <span className="text-[11px] font-medium hidden sm:inline">View Report</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 mb-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/15 flex items-center justify-center font-black text-sm text-white shrink-0 shadow-inner group-hover:border-amber-400/50 group-hover:scale-105 transition-all">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base md:text-lg font-black text-white tracking-tight group-hover:text-amber-300 transition-colors truncate">
                          {item.id}
                        </h3>
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-300">
                          Short Term
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-[10px] font-bold text-blue-300">
                          Initiated: {item.date}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate max-w-[220px] md:max-w-md font-medium">{companyName}</p>
                    </div>
                  </div>
                  <div className="shrink-0">{renderReturnBadge(item.profit)}</div>
                </div>

                <div className="grid grid-cols-4 gap-1.5 py-2.5 px-3 rounded-xl bg-white/[0.02] border border-white/5 mb-3 text-xs">
                  <div>
                    <div className="text-[10px] text-muted-foreground font-semibold uppercase truncate">Buy Price</div>
                    <div className="font-mono font-bold text-blue-300">{item.buyPrice ? `₹${item.buyPrice}` : "—"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground font-semibold uppercase truncate">Current</div>
                    <div className="font-mono font-bold text-cyan-300">{item.currentPrice ? `₹${item.currentPrice}` : "—"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground font-semibold uppercase truncate">Target</div>
                    <div className="font-mono font-bold text-emerald-400">{item.targetPrice ? `₹${item.targetPrice}` : "—"}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-muted-foreground font-semibold uppercase truncate">Holding</div>
                    <div className="font-mono font-bold text-amber-300">{item.holdingDays ? `${item.holdingDays}d` : "—"}</div>
                  </div>
                </div>

                {/* NEW: stoploss → target bar, just above the LASA Research line */}
                <TradeRangeBar
                  stoploss={item.stoploss}
                  target={item.rangeTarget}
                  current={item.currentPrice}
                  potentialLeft={item.potentialLeft}
                  stoplossDistance={item.stoplossDistance}
                  riskReward={item.riskReward}
                />

                <div className="flex items-center justify-between text-[11px] text-muted-foreground/80 pt-2 border-t border-white/5 flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 font-medium text-white/70">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400/80" />
                    <span>LASA Research (SEBI RA)</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px] flex-wrap">
                    {item.holdingDays && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold text-[10px]">
                        {item.holdingDays} Days
                      </span>
                    )}
                    <span>Initiated: <strong className="text-blue-300 font-bold">{item.date}</strong></span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
