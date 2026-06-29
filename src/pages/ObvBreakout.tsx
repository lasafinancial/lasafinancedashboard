import { useState, useMemo } from "react";
import { Search, ArrowUpRight, Loader2, AlertCircle, ChevronDown, ChevronUp, Clock, BarChart2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useLiveData } from "@/hooks/useLiveData";
import { PremiumProtector } from "@/components/ui/PremiumProtector";
import { useAuth } from "@/context/AuthContext";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

type SortField = "symbol" | "close" | "resistance" | "model" | "balance" | "mlGap" | "fr" | "obvSignal";
type SortDirection = "asc" | "desc";

export function ObvBreakout() {
    const navigate = useNavigate();
    const { intradayBreakoutScanner: rawStocks, intradayBreakout, isLoading, stockData } = useLiveData();
    const { isFree } = useAuth();

    const [searchTerm, setSearchTerm] = useState("");
    const [sortField, setSortField] = useState<SortField>("symbol");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

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
            setSortDirection("asc");
        }
    };

    // Filter and Sort Data
    const processedStocks = useMemo(() => {
        if (!rawStocks) return [];

        // Keep only the most recent entry for each symbol
        const latestBySymbol = new Map();
        rawStocks.forEach(stock => {
            const currentLatest = latestBySymbol.get(stock.symbol);
            const stockDateTime = new Date(`${stock.date} ${stock.time}`).getTime();
            
            if (!currentLatest || stockDateTime > currentLatest.time) {
                latestBySymbol.set(stock.symbol, { stock, time: stockDateTime });
            }
        });
        
        let data = Array.from(latestBySymbol.values()).map(item => {
            const boData = intradayBreakout?.find((bo) => bo.symbol === item.stock.symbol);
            return {
                ...item.stock,
                balance: boData?.BALANCE || "—"
            };
        });

        // Apply static filters: accumulation and yes
        data = data.filter(stock => {
            const isYes = String(stock.fr || "").toUpperCase() === "YES";
            const isAcc = String(stock.obvSignal || "").toUpperCase() === "ACCUMULATION" || String(stock.obvSignal || "").toUpperCase() === "BULLISH";
            return isYes && isAcc;
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

            // Fallback to string sorting
            const strA = String(valA || "").toLowerCase();
            const strB = String(valB || "").toLowerCase();
            if (strA < strB) return sortDirection === "asc" ? -1 : 1;
            if (strA > strB) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });

        return data;
    }, [rawStocks, intradayBreakout, searchTerm, sortField, sortDirection]);

    const handleStockClick = (symbol: string) => {
        navigate(`/stocks?symbol=${symbol}`);
    };

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) return null;
        return sortDirection === "asc" ? <ChevronUp className="w-3.5 h-3.5 ml-1 text-primary" /> : <ChevronDown className="w-3.5 h-3.5 ml-1 text-primary" />;
    };

    return (
        <div className="min-h-screen bg-[#020617] text-foreground selection:bg-primary/30">
            {/* Ambient Background Glows */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse delay-700" />
            </div>

            <div className="relative container mx-auto px-4 py-8">
                {/* Screener Top Disclaimer */}
                <div className="mb-6 p-3 rounded-xl bg-primary/5 border border-primary/10 text-center max-w-4xl mx-auto">
                    <p className="text-[11px] md:text-xs text-muted-foreground/80 leading-relaxed font-medium capitalize">
                        Stocks shown are filtered based on the selected analytical criteria and do not constitute buy or sell recommendations. No ranking or prioritization is implied.
                    </p>
                </div>
                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4"
                >
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight text-white">
                                OBV <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent italic">Breakout</span>
                            </h1>
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">LIVE</span>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1.5 flex items-center gap-2">
                            <BarChart2 className="w-4 h-4 text-emerald-400" />
                            Stocks filtered by OBV Accumulation and Breakout signals.
                        </p>
                    </div>
                </motion.div>

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

                {/* Main Table Content */}
                <div className="bg-white/[0.01] border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm shadow-2xl">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Syncing breakout database...</p>
                        </div>
                    ) : processedStocks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <AlertCircle className="w-12 h-12 text-muted-foreground/30 mb-3" />
                            <h3 className="text-[14px] font-black text-white mb-1 uppercase tracking-widest">No Breakouts Found</h3>
                            <p className="text-[11px] text-muted-foreground max-w-md font-bold">
                                {searchTerm
                                    ? `No stocks with ticker "${searchTerm}" match the active criteria.`
                                    : "No stocks currently satisfy the OBV Breakout conditions."}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-white/[0.03]">
                                    <TableRow className="border-white/5 hover:bg-transparent">
                                        <TableHead onClick={() => toggleSort("symbol")} className="w-[120px] text-[11px] font-black text-white/60 uppercase tracking-widest cursor-pointer hover:text-white transition-colors">
                                            <div className="flex items-center">Symbol {getSortIcon("symbol")}</div>
                                        </TableHead>
                                        <TableHead onClick={() => toggleSort("close")} className="text-[11px] font-black text-white/60 uppercase tracking-widest cursor-pointer hover:text-white transition-colors text-right">
                                            <div className="flex items-center justify-end">Price {getSortIcon("close")}</div>
                                        </TableHead>
                                        <TableHead onClick={() => toggleSort("resistance")} className="text-[11px] font-black text-white/60 uppercase tracking-widest cursor-pointer hover:text-white transition-colors text-right">
                                            <div className="flex items-center justify-end">Resistance {getSortIcon("resistance")}</div>
                                        </TableHead>
                                        <TableHead onClick={() => toggleSort("model")} className="text-[11px] font-black text-white/60 uppercase tracking-widest cursor-pointer hover:text-white transition-colors">
                                            <div className="flex items-center">Model {getSortIcon("model")}</div>
                                        </TableHead>
                                        <TableHead onClick={() => toggleSort("balance")} className="text-[11px] font-black text-white/60 uppercase tracking-widest cursor-pointer hover:text-white transition-colors text-right">
                                            <div className="flex items-center justify-end">Balance {getSortIcon("balance")}</div>
                                        </TableHead>
                                        <TableHead onClick={() => toggleSort("mlGap")} className="text-[11px] font-black text-white/60 uppercase tracking-widest cursor-pointer hover:text-white transition-colors text-right">
                                            <div className="flex items-center justify-end">ML_Gap% {getSortIcon("mlGap")}</div>
                                        </TableHead>
                                        <TableHead onClick={() => toggleSort("fr")} className="w-[100px] text-[11px] font-black text-white/60 uppercase tracking-widest text-center cursor-pointer hover:text-white transition-colors">
                                            <div className="flex items-center justify-center">Obv Daily {getSortIcon("fr")}</div>
                                        </TableHead>
                                        <TableHead onClick={() => toggleSort("obvSignal")} className="w-[100px] text-[11px] font-black text-white/60 uppercase tracking-widest text-center cursor-pointer hover:text-white transition-colors">
                                            <div className="flex items-center justify-center">Obv Weekly {getSortIcon("obvSignal")}</div>
                                        </TableHead>
                                        <TableHead className="w-[60px] text-[11px] font-black text-white/60 uppercase tracking-widest text-center">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <PremiumProtector requiredTier="pro" blurLevel="md" title="Premium Feature" description="Upgrade to Pro to view all OBV Breakout signals.">
                                        {(isFree ? processedStocks.slice(0, 8) : processedStocks).map((stock, idx) => (
                                            <TableRow
                                                key={`${stock.symbol}-${idx}`}
                                                className="border-white/5 hover:bg-white/[0.04] transition-colors group"
                                            >
                                                {/* Symbol */}
                                                <TableCell className="py-2">
                                                    <span className="text-sm font-black text-white tracking-tight group-hover:text-primary transition-colors">
                                                        {stock.symbol}
                                                    </span>
                                                </TableCell>
                                                
                                                {/* Price */}
                                                <TableCell className="py-2 text-right font-black font-mono text-sm">
                                                    ₹{formatNumber(stock.close)}
                                                </TableCell>
                                                
                                                {/* Resistance */}
                                                <TableCell className="py-2 text-right font-bold font-mono text-xs text-red-400/80">
                                                    ₹{formatNumber(stock.resistance)}
                                                </TableCell>
                                                
                                                {/* Model */}
                                                <TableCell className="py-2">
                                                    <span className="text-xs font-bold text-orange-400/80 font-mono">
                                                        {stock.model && stock.model !== "N/A" && stock.model !== "" ? stock.model : "—"}
                                                    </span>
                                                </TableCell>
                                                
                                                {/* Balance */}
                                                <TableCell className="py-2 text-right font-bold font-mono text-xs text-blue-400/80">
                                                    {typeof stock.balance === 'number' ? `₹${formatNumber(stock.balance)}` : stock.balance}
                                                </TableCell>
                                                
                                                {/* ML_Gap% */}
                                                <TableCell className="py-2 text-right font-bold font-mono text-xs">
                                                    <span className={stock.mlGap > 0 ? "text-emerald-400" : stock.mlGap < 0 ? "text-rose-400" : "text-white/60"}>
                                                        {formatPercent(stock.mlGap)}
                                                    </span>
                                                </TableCell>
                                                
                                                {/* Obv Daily */}
                                                <TableCell className="py-2 text-center font-bold font-mono text-xs">
                                                    <span className="text-white/80 bg-white/10 px-2 py-0.5 rounded-md">
                                                        {stock.fr || '—'}
                                                    </span>
                                                </TableCell>
                                                
                                                {/* Obv Weekly */}
                                                <TableCell className="py-2 text-center">
                                                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${stock.obvSignal === 'ACCUMULATION' || stock.obvSignal === 'Bullish' || stock.obvSignal === 'BULLISH' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : stock.obvSignal === 'DISTRIBUTION' || stock.obvSignal === 'Bearish' || stock.obvSignal === 'BEARISH' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'text-white/40'}`}>
                                                        {stock.obvSignal || '—'}
                                                    </span>
                                                </TableCell>
                                                
                                                {/* Action Button */}
                                                <TableCell className="py-2 text-center">
                                                    {stockData?.some(s => s.symbol === stock.symbol) ? (
                                                        <button
                                                            onClick={() => handleStockClick(stock.symbol)}
                                                            className="p-1.5 rounded-lg bg-white/5 hover:bg-emerald-500/20 text-muted-foreground hover:text-emerald-300 border border-white/5 transition-all outline-none"
                                                            title="View Details"
                                                        >
                                                            <ArrowUpRight className="w-3.5 h-3.5" />
                                                        </button>
                                                    ) : null}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </PremiumProtector>
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ObvBreakout;
