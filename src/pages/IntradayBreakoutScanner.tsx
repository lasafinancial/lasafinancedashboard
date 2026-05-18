import { useState, useMemo } from "react";
import { Search, ArrowUpRight, Loader2, Sparkles, AlertCircle, ChevronDown, ChevronUp, Clock, Calendar } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useLiveData } from "@/hooks/useLiveData";

type SortField = "symbol" | "date" | "time" | "pattern" | "resGap" | "target" | "model" | "resistance" | "u" | "mlGap";
type SortDirection = "asc" | "desc";

export function IntradayBreakoutScanner() {
    const navigate = useNavigate();
    const { intradayBreakoutScanner: rawStocks, isLoading } = useLiveData();
    
    const [searchTerm, setSearchTerm] = useState("");
    const [sortField, setSortField] = useState<SortField>("date");
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

    // Clean number values
    const formatNumber = (num: number | null | undefined, suffix = "") => {
        if (num === null || num === undefined || isNaN(num)) return "N/A";
        return `${new Intl.NumberFormat('en-IN', {
            maximumFractionDigits: 2,
            minimumFractionDigits: 2
        }).format(num)}${suffix}`;
    };

    const formatPercent = (num: number | null | undefined) => {
        if (num === null || num === undefined || isNaN(num)) return "N/A";
        return `${num >= 0 ? "+" : ""}${num.toFixed(2)}%`;
    };

    const toggleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("desc");
        }
    };

    // Filter and Sort Data
    const processedStocks = useMemo(() => {
        if (!rawStocks) return [];
        
        // Apply static filters: ML_Gap% > 20 AND U > 5
        let data = rawStocks.filter(stock => {
            const ml = stock.mlGap;
            const uVal = stock.u;
            return !isNaN(ml) && ml > 20 && !isNaN(uVal) && uVal > 5;
        });

        // Apply search term filter
        if (searchTerm) {
            data = data.filter(stock =>
                stock.symbol.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Sort data
        data.sort((a, b) => {
            const valA = a[sortField];
            const valB = b[sortField];

            // Numeric fields sorting
            if (typeof valA === 'number' && typeof valB === 'number') {
                return sortDirection === "asc" ? valA - valB : valB - valA;
            }

            // Date and Time sorting
            if (sortField === "time" || sortField === "date") {
                const dateTimeA = new Date(`${a.date} ${a.time}`).getTime();
                const dateTimeB = new Date(`${b.date} ${b.time}`).getTime();
                return sortDirection === "asc" ? dateTimeA - dateTimeB : dateTimeB - dateTimeA;
            }

            // Fallback to string sorting
            const strA = String(valA || "").toLowerCase();
            const strB = String(valB || "").toLowerCase();
            if (strA < strB) return sortDirection === "asc" ? -1 : 1;
            if (strA > strB) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });

        return data;
    }, [rawStocks, searchTerm, sortField, sortDirection]);

    // Calculate metrics based on the latest available date in the dataset
    const metrics = useMemo(() => {
        if (!processedStocks || processedStocks.length === 0) {
            return {
                totalToday: 0,
                highestMLStock: "N/A",
                highestMLVal: null,
                highestUStock: "N/A",
                highestUVal: null,
                latestDate: "N/A"
            };
        }

        // Find the absolute latest date present in the dataset
        const dates = processedStocks.map(x => x.date).filter(Boolean);
        if (dates.length === 0) {
            return {
                totalToday: 0,
                highestMLStock: "N/A",
                highestMLVal: null,
                highestUStock: "N/A",
                highestUVal: null,
                latestDate: "N/A"
            };
        }

        const sortedDates = [...new Set(dates)].sort((a, b) => new Date(b) - new Date(a));
        const latestDate = sortedDates[0];

        // Filter stocks matching today (latest date)
        const stocksToday = processedStocks.filter(x => x.date === latestDate);

        let highestMLStock = "N/A";
        let highestMLVal = -Infinity;
        let highestUStock = "N/A";
        let highestUVal = -Infinity;

        stocksToday.forEach(s => {
            if (s.mlGap > highestMLVal) {
                highestMLVal = s.mlGap;
                highestMLStock = s.symbol;
            }
            if (s.u > highestUVal) {
                highestUVal = s.u;
                highestUStock = s.symbol;
            }
        });

        return {
            totalToday: stocksToday.length,
            highestMLStock,
            highestMLVal: highestMLVal === -Infinity ? null : highestMLVal,
            highestUStock,
            highestUVal: highestUVal === -Infinity ? null : highestUVal,
            latestDate
        };
    }, [processedStocks]);

    const handleStockClick = (symbol: string) => {
        navigate(`/stocks?symbol=${symbol}`);
    };

    const getPatternStyle = (pattern: string) => {
        const p = pattern.toUpperCase();
        if (p.includes("BULLISH") || p.startsWith("BULL")) {
            return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
        }
        if (p.includes("BEARISH") || p.startsWith("BEAR")) {
            return "bg-rose-500/10 text-rose-400 border-rose-500/20";
        }
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    };

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) return null;
        return sortDirection === "asc" ? <ChevronUp className="w-3.5 h-3.5 ml-1 text-primary" /> : <ChevronDown className="w-3.5 h-3.5 ml-1 text-primary" />;
    };

    return (
        <div className="min-h-screen bg-[#020617] text-foreground selection:bg-primary/30">
            {/* Ambient Background Glows */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px] animate-pulse delay-700" />
            </div>

            <div className="relative container mx-auto px-4 py-8">
                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4"
                >
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight text-white">
                                Intraday Breakout Scanner
                            </h1>
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">LIVE</span>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1.5">
                            Stocks filtered by breakout conditions — auto sorted by latest date
                        </p>
                    </div>
                </motion.div>

                {/* Filter Summary Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-wrap items-center gap-2.5 mb-8 p-3 rounded-xl bg-white/[0.02] border border-white/5 backdrop-blur-md"
                >
                    <span className="text-xs text-muted-foreground font-semibold px-1">Active Criteria:</span>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
                        <span>ML Gap% &gt; 20</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
                        <span>Res_Gap% &gt; 5%</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-mono">
                        <span>Sorted: Latest First</span>
                    </div>
                </motion.div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.15 }}
                    >
                        <GlassCard className="p-5 flex flex-col justify-between min-h-[120px] bg-gradient-to-br from-white/[0.03] to-transparent hover:border-white/10 transition-all border border-white/5">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                Total Matching ({metrics.latestDate})
                            </span>
                            <div className="flex items-baseline gap-2 mt-2">
                                <span className="text-3xl font-extrabold text-white">{metrics.totalToday}</span>
                                <span className="text-xs text-muted-foreground">stocks</span>
                            </div>
                        </GlassCard>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <GlassCard className="p-5 flex flex-col justify-between min-h-[120px] bg-gradient-to-br from-white/[0.03] to-transparent hover:border-white/10 transition-all border border-white/5">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                Highest ML Gap% ({metrics.latestDate})
                            </span>
                            <div className="flex items-baseline gap-2 mt-2">
                                <span className="text-3xl font-extrabold text-primary">{metrics.highestMLStock}</span>
                                {metrics.highestMLVal !== null && (
                                    <span className="text-sm font-semibold text-emerald-400">
                                        ({metrics.highestMLVal}%)
                                    </span>
                                )}
                            </div>
                        </GlassCard>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.25 }}
                    >
                        <GlassCard className="p-5 flex flex-col justify-between min-h-[120px] bg-gradient-to-br from-white/[0.03] to-transparent hover:border-white/10 transition-all border border-white/5">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                Highest Res_Gap% ({metrics.latestDate})
                            </span>
                            <div className="flex items-baseline gap-2 mt-2">
                                <span className="text-3xl font-extrabold text-accent">{metrics.highestUStock}</span>
                                {metrics.highestUVal !== null && (
                                    <span className="text-sm font-semibold text-emerald-400">
                                        ({metrics.highestUVal.toFixed(2)}%)
                                    </span>
                                )}
                            </div>
                        </GlassCard>
                    </motion.div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search by Symbol..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.02] border border-white/5 focus:border-primary/50 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all backdrop-blur-md"
                        />
                    </div>
                    
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Showing {processedStocks.length} records matching filters</span>
                    </div>
                </div>

                {/* Main Table */}
                <GlassCard className="overflow-hidden border border-white/5 bg-white/[0.01]">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            <p className="text-sm text-muted-foreground">Syncing breakout database...</p>
                        </div>
                    ) : processedStocks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <AlertCircle className="w-12 h-12 text-muted-foreground/50 mb-3" />
                            <h3 className="text-lg font-bold text-white mb-1">No Breakouts Found</h3>
                            <p className="text-sm text-muted-foreground max-w-md">
                                {searchTerm 
                                    ? `No stocks with ticker "${searchTerm}" match the active criteria.`
                                    : "No stocks in the database currently satisfy the breakout conditions (ML Gap% > 20 AND Res_Gap% > 5%)."}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/10 bg-[#020617]/85 backdrop-blur-md sticky top-0 z-50">
                                        <th onClick={() => toggleSort("symbol")} className="px-5 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-white transition-colors">
                                            <div className="flex items-center">Symbol {getSortIcon("symbol")}</div>
                                        </th>
                                        <th onClick={() => toggleSort("date")} className="px-4 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-white transition-colors">
                                            <div className="flex items-center">Date {getSortIcon("date")}</div>
                                        </th>
                                        <th onClick={() => toggleSort("time")} className="px-4 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-white transition-colors">
                                            <div className="flex items-center">Time {getSortIcon("time")}</div>
                                        </th>
                                        <th onClick={() => toggleSort("pattern")} className="px-4 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-white transition-colors">
                                            <div className="flex items-center">Pattern {getSortIcon("pattern")}</div>
                                        </th>
                                        <th onClick={() => toggleSort("resGap")} className="px-4 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-white transition-colors text-right">
                                            <div className="flex items-center justify-end">Res_Gap% {getSortIcon("resGap")}</div>
                                        </th>
                                        <th onClick={() => toggleSort("target")} className="px-4 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-white transition-colors text-right">
                                            <div className="flex items-center justify-end">Target {getSortIcon("target")}</div>
                                        </th>
                                        <th onClick={() => toggleSort("model")} className="px-4 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-white transition-colors">
                                            <div className="flex items-center">Model {getSortIcon("model")}</div>
                                        </th>
                                        <th onClick={() => toggleSort("resistance")} className="px-4 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-white transition-colors text-right">
                                            <div className="flex items-center justify-end">Resistance {getSortIcon("resistance")}</div>
                                        </th>
                                        <th onClick={() => toggleSort("u")} className="px-4 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-white transition-colors text-right">
                                            <div className="flex items-center justify-end">Res_Gap% (Price_Move) {getSortIcon("u")}</div>
                                        </th>
                                        <th onClick={() => toggleSort("mlGap")} className="px-4 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-white transition-colors text-right">
                                            <div className="flex items-center justify-end">ML_Gap% {getSortIcon("mlGap")}</div>
                                        </th>
                                        <th className="px-5 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {processedStocks.map((stock, idx) => (
                                        <tr 
                                            key={`${stock.symbol}-${stock.date}-${stock.time}-${idx}`}
                                            className="hover:bg-white/[0.02] transition-colors group"
                                        >
                                            {/* Symbol */}
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <span className="px-2.5 py-1 rounded bg-white/5 text-xs text-foreground font-mono font-bold tracking-wide border border-white/5">
                                                    {stock.symbol}
                                                </span>
                                            </td>

                                            {/* Date */}
                                            <td className="px-4 py-3.5 text-xs text-foreground/80 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5 text-muted-foreground/60" />
                                                    <span>{stock.date}</span>
                                                </div>
                                            </td>

                                            {/* Time */}
                                            <td className="px-4 py-3.5 text-xs text-foreground/80 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5 text-muted-foreground/60" />
                                                    <span>{stock.time}</span>
                                                </div>
                                            </td>

                                            {/* Pattern */}
                                            <td className="px-4 py-3.5 text-xs whitespace-nowrap">
                                                {stock.pattern && stock.pattern !== "N/A" && stock.pattern !== "" ? (
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getPatternStyle(stock.pattern)}`}>
                                                        {stock.pattern}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground/40">—</span>
                                                )}
                                            </td>

                                            {/* Res_Gap% */}
                                            <td className="px-4 py-3.5 text-xs text-right font-mono whitespace-nowrap">
                                                <span className={stock.resGap > 0 ? "text-emerald-400 font-semibold" : stock.resGap < 0 ? "text-rose-400 font-semibold" : "text-muted-foreground/80"}>
                                                    {formatPercent(stock.resGap)}
                                                </span>
                                            </td>

                                            {/* Target */}
                                            <td className="px-4 py-3.5 text-xs text-right font-mono whitespace-nowrap text-white/90">
                                                {formatNumber(stock.target)}
                                            </td>

                                            {/* Model */}
                                            <td className="px-4 py-3.5 text-xs whitespace-nowrap">
                                                {stock.model && stock.model !== "N/A" && stock.model !== "" ? (
                                                    <span className="border border-primary/30 text-primary px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                                                        {stock.model}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground/40">—</span>
                                                )}
                                            </td>

                                            {/* Resistance */}
                                            <td className="px-4 py-3.5 text-xs text-right font-mono whitespace-nowrap text-white/90">
                                                {formatNumber(stock.resistance)}
                                            </td>

                                            {/* Res_Gap% (Price_%_Move) */}
                                            <td className="px-4 py-3.5 text-xs text-right font-mono whitespace-nowrap">
                                                <span className={stock.u > 0 ? "text-emerald-400 font-semibold" : stock.u < 0 ? "text-rose-400 font-semibold" : "text-muted-foreground/80"}>
                                                    {formatPercent(stock.u)}
                                                </span>
                                            </td>

                                            {/* ML_Gap% */}
                                            <td className="px-4 py-3.5 text-xs text-right font-mono whitespace-nowrap">
                                                <span className={stock.mlGap > 0 ? "text-emerald-400 font-bold" : stock.mlGap < 0 ? "text-rose-400 font-bold" : "text-muted-foreground/80"}>
                                                    {formatPercent(stock.mlGap)}
                                                </span>
                                            </td>

                                            {/* Action Button */}
                                            <td className="px-5 py-3.5 text-right whitespace-nowrap">
                                                <button
                                                    onClick={() => handleStockClick(stock.symbol)}
                                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-primary/20 text-muted-foreground hover:text-white border border-white/5 transition-all outline-none"
                                                    title="View Details"
                                                >
                                                    <ArrowUpRight className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </GlassCard>
            </div>
        </div>
    );
}

export default IntradayBreakoutScanner;
