import { useState, useMemo } from "react";
import { Search, ArrowUpRight, Loader2, Sparkles, TrendingUp, TrendingDown, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useLiveData } from "@/hooks/useLiveData";

type SortField = "id" | "sector" | "currentPrice" | "low52" | "resistance" | "support";
type SortDirection = "asc" | "desc";

const SORT_OPTIONS: { field: SortField; label: string }[] = [
    { field: "id", label: "Symbol" },
    { field: "sector", label: "Sector" },
    { field: "currentPrice", label: "Price" },
    { field: "low52", label: "52W Low" },
    { field: "resistance", label: "Resistance" },
    { field: "support", label: "Support" },
];

export function Week52Low() {
    const navigate = useNavigate();
    const { week52Low: stocks, isLoading, stockData } = useLiveData();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedGroup, setSelectedGroup] = useState<string>("ALL");
    const [sortField, setSortField] = useState<SortField>("id");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

    const formatNumber = (num: number) => {
        if (num === null || num === undefined || isNaN(num) || num === 0) return "—";
        return new Intl.NumberFormat('en-IN', {
            maximumFractionDigits: 2,
            minimumFractionDigits: 2
        }).format(num);
    };

    const toggleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    // Extract available groups / categories
    const groups = useMemo(() => {
        const set = new Set<string>();
        (stocks || []).forEach(s => {
            if (s.group && s.group.trim()) {
                set.add(s.group.trim().toUpperCase());
            } else if (s.sector && s.sector.trim()) {
                set.add(s.sector.trim().toUpperCase());
            }
        });
        return Array.from(set).sort();
    }, [stocks]);

    const processedStocks = useMemo(() => {
        if (!stocks) return [];
        let data = [...stocks];

        // Filter by Category/Group
        if (selectedGroup !== "ALL") {
            data = data.filter(s => {
                const grp = (s.group || '').trim().toUpperCase();
                const sec = (s.sector || '').trim().toUpperCase();
                return grp === selectedGroup || sec === selectedGroup;
            });
        }

        // Filter by Search
        if (searchTerm) {
            const query = searchTerm.toLowerCase().trim();
            data = data.filter(s =>
                s.id.toLowerCase().includes(query) ||
                (s.sector && s.sector.toLowerCase().includes(query)) ||
                (s.group && s.group.toLowerCase().includes(query))
            );
        }

        // Sorting
        data.sort((a, b) => {
            const valA = a[sortField];
            const valB = b[sortField];

            if (typeof valA === 'number' && typeof valB === 'number') {
                return sortDirection === "asc" ? valA - valB : valB - valA;
            }

            const strA = String(valA || "").toLowerCase();
            const strB = String(valB || "").toLowerCase();
            if (strA < strB) return sortDirection === "asc" ? -1 : 1;
            if (strA > strB) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });

        return data;
    }, [stocks, searchTerm, selectedGroup, sortField, sortDirection]);

    // Only link cards to stocks that have chart data with real prices (the stock page otherwise falls back to a fuzzy match)
    const normalizeSymbol = (symbol: string) => (symbol || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const chartSymbols = useMemo(
        () => new Set(
            (stockData || [])
                .filter((s: any) => (s.history || []).some((h: any) => typeof h.price === 'number' && h.price > 0))
                .map((s: any) => normalizeSymbol(s.symbol))
        ),
        [stockData]
    );

    const handleStockClick = (symbol: string) => {
        const cleanSymbol = symbol.replace(/[\[\]\(\):-]/g, '').trim().toUpperCase();
        navigate(`/stocks?symbol=${cleanSymbol}`);
    };

    return (
        <div className="min-h-screen bg-[#020617] text-foreground selection:bg-primary/30">
            {/* Ambient Background Glow */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-1/3 left-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] animate-pulse delay-700" />
            </div>

            <div className="relative container mx-auto px-4 py-8 pb-20">
                {/* Screener Top Disclaimer */}
                <div className="mb-6 p-3 rounded-xl bg-primary/5 border border-primary/10 text-center">
                    <p className="text-[11px] md:text-xs text-muted-foreground/80 leading-relaxed font-medium">
                        Stocks shown are filtered based on the selected analytical criteria and do not constitute buy or sell recommendations. No ranking or prioritization is implied.
                    </p>
                </div>

                {/* Header with Quick Toggle Tabs */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider mb-2">
                                <TrendingDown className="w-3.5 h-3.5" />
                                Screener: 52 Week Low
                            </div>
                            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white flex items-center gap-3">
                                52 WEEK <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-400 to-amber-400">LOW</span>
                            </h1>
                            <p className="text-muted-foreground text-sm mt-1">
                                Stocks currently trading within 5% of their 52-week low with key structural support and resistance levels.
                            </p>
                        </div>

                        {/* Quick Screeners Switcher */}
                        <div className="flex items-center gap-2 self-start lg:self-center bg-white/5 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
                            <Link
                                to="/screeners/52-week-high"
                                className="px-4 py-2 rounded-xl text-xs font-bold tracking-wide text-white/70 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
                            >
                                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                                52W High
                            </Link>
                            <button
                                className="px-4 py-2 rounded-xl text-xs font-black tracking-wide bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/20 flex items-center gap-2"
                            >
                                <TrendingDown className="w-3.5 h-3.5" />
                                52W Low ({stocks?.length || 0})
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Filters and Controls */}
                <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between mb-6">
                    {/* Category Filter Pills */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
                        <button
                            onClick={() => setSelectedGroup("ALL")}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                                selectedGroup === "ALL"
                                    ? "bg-rose-500 text-white font-black shadow-lg shadow-rose-500/20"
                                    : "bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border border-white/10"
                            }`}
                        >
                            All ({stocks?.length || 0})
                        </button>
                        {groups.map(grp => {
                            const count = (stocks || []).filter(s => (s.group || '').trim().toUpperCase() === grp || (s.sector || '').trim().toUpperCase() === grp).length;
                            return (
                                <button
                                    key={grp}
                                    onClick={() => setSelectedGroup(grp)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                                        selectedGroup === grp
                                            ? "bg-rose-500 text-white font-black shadow-lg shadow-rose-500/20"
                                            : "bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border border-white/10"
                                    }`}
                                >
                                    {grp} ({count})
                                </button>
                            );
                        })}
                    </div>

                    {/* Search Input */}
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                            type="text"
                            placeholder="Search symbol or sector..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-rose-400/40 backdrop-blur-md"
                        />
                    </div>
                </div>

                {/* Table Section */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-rose-400" />
                        <p className="text-sm font-medium text-white/60">Scanning 52-week low levels...</p>
                    </div>
                ) : processedStocks.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-12 text-center">
                        <TrendingDown className="w-12 h-12 text-white/20 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-white mb-1">No matching stocks found</h3>
                        <p className="text-sm text-white/50 max-w-sm mx-auto">
                            No stocks are currently within 5% of their 52-week low matching your search criteria.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Summary + Sort Bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 text-xs text-white/60 font-medium">
                            <div>
                                Showing <span className="text-white font-bold">{processedStocks.length}</span> stocks near 52-week low
                            </div>
                            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                                <span className="text-[11px] text-white/40 uppercase tracking-widest mr-1">Sort</span>
                                {SORT_OPTIONS.map(opt => (
                                    <button
                                        key={opt.field}
                                        onClick={() => toggleSort(opt.field)}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap flex items-center gap-1 transition-all ${
                                            sortField === opt.field
                                                ? "bg-rose-500 text-white"
                                                : "bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border border-white/10"
                                        }`}
                                    >
                                        {opt.label}
                                        {sortField === opt.field && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Stock Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {processedStocks.map((stock, i) => {
                                const distance = stock.low52 > 0 && stock.currentPrice > 0 ? ((stock.currentPrice - stock.low52) / stock.low52) * 100 : null;
                                // Within-5% window: a full bar means the price is right at the 52W low
                                const proximity = distance === null ? 0 : Math.max(0, Math.min(100, 100 - (distance / 5) * 100));
                                const hasChart = chartSymbols.has(normalizeSymbol(stock.id));
                                const sectorLabel = (stock.sector && stock.sector !== stock.id) ? stock.sector : (stock.group && stock.group !== stock.id ? stock.group : '—');
                                return (
                                    <motion.div
                                        key={stock.id}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: Math.min(i, 12) * 0.03 }}
                                        onClick={hasChart ? () => handleStockClick(stock.id) : undefined}
                                        className={`group relative rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-4 sm:p-5 transition-all duration-300 shadow-xl ${
                                            hasChart ? "cursor-pointer hover:border-rose-500/40 hover:bg-white/[0.04] hover:-translate-y-0.5" : ""
                                        }`}
                                    >
                                        {/* Header */}
                                        <div className="flex items-start justify-between gap-3 mb-4">
                                            <div className="min-w-0">
                                                <h3 className={`text-base font-black text-white tracking-tight truncate ${hasChart ? "group-hover:text-rose-400" : ""} transition-colors`}>
                                                    {stock.id}
                                                </h3>
                                                <p className="text-[11px] text-white/50 font-medium uppercase tracking-wide truncate">{sectorLabel}</p>
                                            </div>
                                            {hasChart && (
                                                <div className="p-2 rounded-xl bg-white/5 border border-white/10 group-hover:bg-rose-500 group-hover:text-white group-hover:border-rose-500 transition-all duration-200 shrink-0">
                                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Price + distance */}
                                        <div className="flex flex-wrap items-end justify-between gap-x-2 gap-y-2 mb-3">
                                            <div>
                                                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-0.5">Current Price</p>
                                                <p className="text-xl sm:text-2xl font-black tabular-nums text-white">₹{formatNumber(stock.currentPrice)}</p>
                                            </div>
                                            {distance !== null && (
                                                <span className="px-2 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] font-bold tabular-nums whitespace-nowrap">
                                                    {distance.toFixed(2)}% above 52W low
                                                </span>
                                            )}
                                        </div>

                                        {/* Proximity bar */}
                                        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mb-4">
                                            <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-400" style={{ width: `${proximity}%` }} />
                                        </div>

                                        {/* Levels */}
                                        <div className="grid grid-cols-3 gap-x-3 gap-y-1 pt-3 border-t border-white/5">
                                            <div>
                                                <p className="text-[9px] sm:text-[10px] text-white/40 font-bold uppercase tracking-wider">52W Low</p>
                                                <p className="text-[11px] sm:text-xs font-black tabular-nums text-rose-400">₹{formatNumber(stock.low52)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] sm:text-[10px] text-white/40 font-bold uppercase tracking-wider">Resistance</p>
                                                <p className="text-[11px] sm:text-xs font-bold tabular-nums text-rose-400">₹{formatNumber(stock.resistance)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] sm:text-[10px] text-white/40 font-bold uppercase tracking-wider">Support</p>
                                                <p className="text-[11px] sm:text-xs font-bold tabular-nums text-emerald-400">₹{formatNumber(stock.support)}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
export default Week52Low;
