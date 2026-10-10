import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AlertCircle, ArrowUpRight, ChevronDown, ChevronUp, Loader2, Search, Sparkles } from "lucide-react";
import { getApiUrl } from "@/config/api";
import { Checkbox } from "@/components/ui/checkbox";
import { useLiveData } from "@/hooks/useLiveData";

type SlopePoint = { date: string; value: number | null; close?: number | null };
type StockV2 = {
    id: string;
    inFno: boolean;
    close: number | null;
    closeChangePct: number | null;
    slope: number | null;
    slopeDelta: number | null;
    slopeSeries: SlopePoint[];
    obvSignal: string;
    dailyBreakout: string;
    ema9: number | null;
    ema20: number | null;
    trend10d: string;
    isNew: boolean;
};
type ScanV2 = { asOf: string | null; dates: string[]; totalStocks: number; stocks: StockV2[]; refreshedAt?: string };

type SortField = "id" | "close" | "closeChangePct" | "slope" | "slopeDelta";
const SORT_OPTIONS: { field: SortField; label: string }[] = [
    { field: "id", label: "Symbol" },
    { field: "close", label: "Close" },
    { field: "closeChangePct", label: "Day Δ%" },
    { field: "slope", label: "OBV Slope" },
    { field: "slopeDelta", label: "OBV Slope Δ" },
];

type FilterKey = "fno" | "trendUp" | "trendDown" | "nearEma";
// "Near" = close within this % of the weekly EMA 9 or EMA 20
const NEAR_EMA_PCT = 2;
const FILTER_GROUPS: { title: string; options: { key: FilterKey; label: string }[] }[] = [
    { title: "Show", options: [{ key: "fno", label: "F&O only" }] },
    { title: "Price slope trend (10D)", options: [{ key: "trendUp", label: "Increasing" }, { key: "trendDown", label: "Decreasing" }] },
    { title: "Weekly EMAs", options: [{ key: "nearEma", label: `Near EMA 9 / EMA 20 (within ${NEAR_EMA_PCT}%)` }] },
];
const TREND_KEYS: Partial<Record<FilterKey, string>> = { trendUp: "INCREASING", trendDown: "DECREASING" };

const isNear = (close: number | null, ema: number | null) =>
    close !== null && ema !== null && ema > 0 && Math.abs((close - ema) / ema) * 100 <= NEAR_EMA_PCT;
const PREDICATES: Partial<Record<FilterKey, (s: StockV2) => boolean>> = {
    fno: (s) => s.inFno,
    nearEma: (s) => isNear(s.close, s.ema9) || isNear(s.close, s.ema20),
};

// AND across groups; the trend options combine with OR
function applyFilters(list: StockV2[], active: Set<FilterKey>): StockV2[] {
    const trends = [...active].map((k) => TREND_KEYS[k]).filter(Boolean) as string[];
    return list.filter((s) => {
        for (const key of active) {
            const pred = PREDICATES[key];
            if (pred && !pred(s)) return false;
        }
        return trends.length === 0 || trends.includes(s.trend10d);
    });
}

const fmt = (n: number | null | undefined, digits = 2) =>
    n === null || n === undefined || isNaN(n)
        ? "—"
        : new Intl.NumberFormat("en-IN", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);

const signed = (n: number | null, suffix = "") => (n === null ? "—" : `${n > 0 ? "+" : ""}${fmt(n)}${suffix}`);
const deltaColor = (n: number | null) => (n === null || n === 0 ? "text-white/50" : n > 0 ? "text-emerald-400" : "text-rose-400");

const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    const d = new Date(`${iso}T00:00:00`);
    return isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const PRICE_LINE = "#38bdf8"; // sky-400

/**
 * Column I (OBV_SLOPE_NORM) and the close price (column E) over the last trading days.
 * Each line is scaled to its own range, so the chart compares their shape and direction.
 */
function SlopeSparkline({ series }: { series: SlopePoint[] }) {
    const W = 240, H = 56, PAD = 4;
    const scaleLine = (vals: (number | null | undefined)[]) => {
        const pts = vals.map((v, i) => ({ i, v })).filter((p): p is { i: number; v: number } => typeof p.v === "number");
        if (pts.length < 2) return null;
        const min = Math.min(...pts.map((p) => p.v));
        const max = Math.max(...pts.map((p) => p.v));
        const span = max - min || 1;
        const x = (i: number) => PAD + (i / (vals.length - 1)) * (W - PAD * 2);
        const y = (v: number) => PAD + (1 - (v - min) / span) * (H - PAD * 2);
        const path = pts.map((p, k) => `${k === 0 ? "M" : "L"}${x(p.i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
        const last = pts[pts.length - 1];
        return { path, first: pts[0].v, last: last.v, lastX: x(last.i), lastY: y(last.v), zeroY: min < 0 && max > 0 ? y(0) : null };
    };

    const obv = scaleLine(series.map((p) => p.value));
    const price = scaleLine(series.map((p) => p.close));
    if (!obv) return <div className="h-14 flex items-center text-[11px] text-white/30">Not enough history</div>;
    const obvStroke = obv.last >= obv.first ? "#34d399" : "#fb7185";

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-14" preserveAspectRatio="none" role="img"
            aria-label={`OBV slope from ${fmt(obv.first)} to ${fmt(obv.last)}${price ? `, price from ₹${fmt(price.first)} to ₹${fmt(price.last)}` : ""} over ${series.length} days`}>
            {obv.zeroY !== null && <line x1={0} x2={W} y1={obv.zeroY} y2={obv.zeroY} stroke="rgba(255,255,255,0.15)" strokeDasharray="3 3" strokeWidth={1} />}
            {price && <path d={price.path} fill="none" stroke={PRICE_LINE} strokeWidth={1.5} strokeDasharray="4 3" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" opacity={0.85} />}
            <path d={obv.path} fill="none" stroke={obvStroke} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            <circle cx={obv.lastX} cy={obv.lastY} r={3} fill={obvStroke} />
        </svg>
    );
}

export function AccumulationScanV2() {
    const navigate = useNavigate();
    const { stockData } = useLiveData();
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilters, setActiveFilters] = useState<Set<FilterKey>>(new Set());
    const toggleFilter = (key: FilterKey) =>
        setActiveFilters((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    const [sortField, setSortField] = useState<SortField>("id");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

    // The sheet is refreshed on the server at most once an hour; poll on the same schedule
    const { data, isLoading, isError } = useQuery<ScanV2>({
        queryKey: ["accumulation-v2"],
        queryFn: async () => {
            const res = await fetch(getApiUrl("/api/accumulation-v2"));
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        },
        staleTime: 60 * 60 * 1000,
        refetchInterval: 60 * 60 * 1000,
    });

    // Only link to stocks that have chart data with real prices
    const chartSymbols = useMemo(
        () => new Set((stockData || [])
            .filter((s: any) => (s.history || []).some((h: any) => typeof h.price === "number" && h.price > 0))
            .map((s: any) => (s.symbol || "").toUpperCase().replace(/[^A-Z0-9]/g, ""))),
        [stockData]
    );

    const stocks = useMemo(() => {
        let list = applyFilters(data?.stocks || [], activeFilters);
        if (searchTerm) {
            const q = searchTerm.toLowerCase().trim();
            list = list.filter((s) => s.id.toLowerCase().includes(q));
        }
        return [...list].sort((a, b) => {
            const va = a[sortField], vb = b[sortField];
            if (typeof va === "number" || typeof vb === "number") {
                const na = typeof va === "number" ? va : -Infinity, nb = typeof vb === "number" ? vb : -Infinity;
                return sortDirection === "asc" ? na - nb : nb - na;
            }
            const cmp = String(va).localeCompare(String(vb));
            return sortDirection === "asc" ? cmp : -cmp;
        });
    }, [data, activeFilters, searchTerm, sortField, sortDirection]);

    const toggleSort = (field: SortField) => {
        if (sortField === field) setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        else {
            setSortField(field);
            setSortDirection(field === "id" ? "asc" : "desc");
        }
    };

    const newCount = (data?.stocks || []).filter((s) => s.isNew).length;
    const countIfToggled = (key: FilterKey) => {
        const next = new Set(activeFilters);
        next.add(key);
        return applyFilters(data?.stocks || [], next).length;
    };

    return (
        <div className="min-h-screen bg-[#020617] text-foreground selection:bg-primary/30 font-sans">
            <div className="relative container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
                            Accumulation Scan <span className="text-indigo-400">2.0</span>
                        </h1>
                        <p className="text-[15px] text-muted-foreground mb-2">
                            Stocks with OBV accumulation and a daily OBV breakout, with the 10-day OBV-slope trend.
                        </p>
                        <p className="text-[13px] text-muted-foreground/60 mb-3">
                            Data as of {formatDate(data?.asOf ?? null)} · refreshed hourly · {data ? `${data.stocks.length} stocks` : "loading"}
                            {newCount > 0 && <> · <span className="text-amber-400">{newCount} new today</span></>}
                        </p>
                        <p className="text-xs font-semibold text-amber-400/90">No Buy/Sell Recommendations</p>
                    </div>
                    <div className="relative w-full md:w-64 mt-2">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                            type="text"
                            placeholder="Search symbol..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0f172a] border border-white/5 focus:border-white/20 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all"
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4 bg-[#0f172a]/50 border border-white/5 rounded-xl">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Loading...</p>
                    </div>
                ) : isError || !data ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center bg-[#0f172a]/50 border border-white/5 rounded-xl">
                        <AlertCircle className="w-12 h-12 text-muted-foreground/30 mb-3" />
                        <h3 className="text-[14px] font-black text-white mb-1 uppercase tracking-widest">Data unavailable</h3>
                        <p className="text-[11px] text-muted-foreground max-w-md font-bold">The scan couldn't be loaded. Please try again later.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Checkbox filters: AND across groups, OR within the trend group */}
                        <div className="rounded-xl border border-white/10 bg-[#0f172a]/60 p-4">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-bold uppercase tracking-widest text-white/60">
                                    Filters <span className="text-white/40 normal-case tracking-normal font-medium">· {stocks.length} of {data.stocks.length} stocks</span>
                                </p>
                                {activeFilters.size > 0 && (
                                    <button onClick={() => setActiveFilters(new Set())} className="text-xs font-semibold text-indigo-300 hover:text-indigo-200">
                                        Clear all
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
                                {FILTER_GROUPS.map((group) => (
                                    <fieldset key={group.title}>
                                        <legend className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-2">{group.title}</legend>
                                        <div className="space-y-2">
                                            {group.options.map((opt) => {
                                                const id = `acc2-filter-${opt.key}`;
                                                const checked = activeFilters.has(opt.key);
                                                return (
                                                    <label key={opt.key} htmlFor={id} className="flex items-center gap-2.5 cursor-pointer select-none">
                                                        <Checkbox id={id} checked={checked} onCheckedChange={() => toggleFilter(opt.key)} />
                                                        <span className={`text-sm ${checked ? "text-white" : "text-white/70"}`}>
                                                            {opt.label}
                                                            <span className="ml-1.5 text-xs tabular-nums text-white/40">
                                                                ({checked ? stocks.length : countIfToggled(opt.key)})
                                                            </span>
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </fieldset>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <div className="flex items-center gap-1.5 overflow-x-auto">
                                <span className="text-[11px] text-white/40 uppercase tracking-widest mr-1">Sort</span>
                                {SORT_OPTIONS.map((opt) => (
                                    <button key={opt.field} onClick={() => toggleSort(opt.field)}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap flex items-center gap-1 transition-all ${sortField === opt.field ? "bg-indigo-500 text-white" : "bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border border-white/10"}`}>
                                        {opt.label}
                                        {sortField === opt.field && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {stocks.length === 0 ? (
                            <div className="py-16 text-center text-sm text-muted-foreground bg-[#0f172a]/50 border border-white/5 rounded-xl">
                                No stocks match these filters.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {stocks.map((s, idx) => {
                                    const hasChart = chartSymbols.has(s.id.replace(/[^A-Z0-9]/g, ""));
                                    return (
                                        <motion.div
                                            key={s.id}
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: Math.min(idx, 12) * 0.03 }}
                                            onClick={hasChart ? () => navigate(`/stocks?symbol=${s.id}`) : undefined}
                                            className={`group relative rounded-2xl border border-white/10 bg-[#0f172a]/60 backdrop-blur-xl p-4 sm:p-5 transition-all duration-300 shadow-xl ${hasChart ? "cursor-pointer hover:border-indigo-500/40 hover:bg-white/[0.04] hover:-translate-y-0.5" : ""}`}
                                        >
                                            {/* Header */}
                                            <div className="flex items-start justify-between gap-3 mb-3">
                                                <div className="min-w-0">
                                                    <h3 className={`text-base font-black text-white tracking-tight truncate transition-colors ${hasChart ? "group-hover:text-indigo-300" : ""}`}>{s.id}</h3>
                                                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                                        {s.inFno && <span className="px-1.5 py-0.5 rounded border border-sky-500/30 bg-sky-500/10 text-sky-300 text-[10px] font-bold tracking-wider">F&O</span>}
                                                        {s.isNew && <span className="px-1.5 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-300 text-[10px] font-bold tracking-wider flex items-center gap-1"><Sparkles className="w-3 h-3" />NEW</span>}
                                                    </div>
                                                </div>
                                                {hasChart && (
                                                    <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-cyan-400 group-hover:bg-indigo-500 group-hover:text-white group-hover:border-indigo-500 transition-all duration-200 shrink-0">
                                                        <ArrowUpRight className="w-3.5 h-3.5" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Close (E) with day delta */}
                                            <div className="flex items-end justify-between gap-2 mb-3">
                                                <div>
                                                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-0.5">Close</p>
                                                    <p className="text-xl sm:text-2xl font-black tabular-nums text-white">₹{fmt(s.close)}</p>
                                                </div>
                                                <span className={`text-sm font-bold tabular-nums ${deltaColor(s.closeChangePct)}`}>{signed(s.closeChangePct, "%")}</span>
                                            </div>

                                            {/* Column I (OBV slope) line chart */}
                                            <div className="rounded-lg bg-black/20 border border-white/5 px-2 pt-1.5 pb-1 mb-3">
                                                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider mb-0.5">
                                                    <span className="text-white/40">OBV Slope (10D)</span>
                                                    <span className="tabular-nums text-white">
                                                        {fmt(s.slope)} <span className={deltaColor(s.slopeDelta)}>{signed(s.slopeDelta)}</span>
                                                    </span>
                                                </div>
                                                <SlopeSparkline series={s.slopeSeries} />
                                                <div className="flex items-center gap-3 text-[9px] font-semibold uppercase tracking-wider text-white/40 mt-0.5">
                                                    <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 rounded bg-emerald-400" />OBV slope</span>
                                                    <span className="flex items-center gap-1"><span className="inline-block w-3 border-t border-dashed" style={{ borderColor: PRICE_LINE }} />Price</span>
                                                </div>
                                            </div>

                                            {/* Signals (K, L, Q) */}
                                            <div className="flex flex-wrap gap-1.5 mb-3">
                                                <span className="px-2 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-[10px] font-bold tracking-wider">{s.obvSignal || "—"}</span>
                                                <span className="px-2 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-[10px] font-bold tracking-wider">DAILY BO: {s.dailyBreakout || "—"}</span>
                                                <span className={`px-2 py-0.5 rounded border text-[10px] font-bold tracking-wider ${s.trend10d === "INCREASING" ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400" : s.trend10d === "DECREASING" ? "border-rose-500/20 bg-rose-500/5 text-rose-400" : "border-white/10 bg-white/5 text-white/60"}`}>
                                                    10D: {s.trend10d || "—"}
                                                </span>
                                            </div>

                                            {/* Weekly EMAs (N, O) */}
                                            <div className="grid grid-cols-2 gap-x-3 pt-3 border-t border-white/5">
                                                <div>
                                                    <p className="text-[9px] sm:text-[10px] text-white/40 font-bold uppercase tracking-wider">Weekly EMA 9</p>
                                                    <p className="text-[11px] sm:text-xs font-bold tabular-nums text-white/80">₹{fmt(s.ema9)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[9px] sm:text-[10px] text-white/40 font-bold uppercase tracking-wider">Weekly EMA 20</p>
                                                    <p className="text-[11px] sm:text-xs font-bold tabular-nums text-white/80">₹{fmt(s.ema20)}</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                <p className="mt-8 pt-6 border-t border-white/5 text-[11px] text-muted-foreground/60 leading-relaxed max-w-5xl">
                    Screener results are generated algorithmically and are for educational and informational purposes only. They are not a recommendation to buy, sell or hold any security. Lasa Research Services (Analyst: Dheeraj Sogani), SEBI Registered Research Analyst, Reg. No. INH000030144.
                </p>
            </div>
        </div>
    );
}

export default AccumulationScanV2;
