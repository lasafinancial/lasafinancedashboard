import { useState, useMemo } from "react";
import { Search, ArrowUpRight, Loader2, Sparkles, AlertCircle, TrendingUp, ChevronDown, ChevronUp, Info, Clock, Calendar } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
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

// Updated type to match backend keys exactly
type SortField = "symbol" | "date" | "time" | "close" | "Volume_multiplie" | "Price_%_Move" | "BALANCE" | "MODEL" | "PATTERN" | "RESISTANCE";
type SortDirection = "asc" | "desc";

export function IntradayBreakout() {
    const navigate = useNavigate();
    const { intradayBreakout: stocks, isLoading, stockData } = useLiveData();
    const { isFree } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [sortField, setSortField] = useState<SortField>("time");
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

    const formatNumber = (num: number) => {
        if (num === null || num === undefined) return "N/A";
        return new Intl.NumberFormat('en-IN', {
            maximumFractionDigits: 2,
            minimumFractionDigits: 2
        }).format(num);
    };

    const formatPercent = (num: number) => {
        if (num === null || num === undefined) return "N/A";
        return `${num.toFixed(2)}%`;
    };

    const toggleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("desc");
        }
    };

    const processedStocks = useMemo(() => {
        if (!stocks) return [];
        let data = [...stocks];

        if (searchTerm) {
            data = data.filter(stock =>
                stock.symbol.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        data.sort((a, b) => {
            const valA = a[sortField];
            const valB = b[sortField];

            // Handle numeric vs string sorting
            if (typeof valA === 'number' && typeof valB === 'number') {
                return sortDirection === "asc" ? valA - valB : valB - valA;
            }

            // Date + Time sorting logic
            if (sortField === "time" || sortField === "date") {
                const dateTimeA = new Date(`${a.date} ${a.time}`).getTime();
                const dateTimeB = new Date(`${b.date} ${b.time}`).getTime();
                return sortDirection === "asc" ? dateTimeA - dateTimeB : dateTimeB - dateTimeA;
            }

            const strA = String(valA || "").toLowerCase();
            const strB = String(valB || "").toLowerCase();
            if (strA < strB) return sortDirection === "asc" ? -1 : 1;
            if (strA > strB) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });

        return data;
    }, [stocks, searchTerm, sortField, sortDirection]);

    const handleStockClick = (symbol: string) => {
        navigate(`/stocks?symbol=${symbol}`);
    };

    return (
        <div className="min-h-screen bg-[#020617] text-foreground selection:bg-primary/30">
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px] animate-pulse delay-700" />
            </div>

            <div className="relative container mx-auto px-4 py-8">
                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider w-fit">
                                <Sparkles className="w-3 h-3" />
                                Screener: Intraday
                            </div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold tracking-tight">
                                    Intraday Volume <span className="gradient-text italic">Breakout</span>
                                </h1>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <button className="p-1 rounded-full hover:bg-white/10 transition-colors text-muted-foreground hover:text-primary">
                                            <Info className="w-5 h-5" />
                                        </button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl bg-[#0f172a]/95 backdrop-blur-xl border-white/10 text-white">
                                        <DialogHeader>
                                            <DialogTitle className="text-2xl font-bold gradient-text">Intraday Volume Breakout Scanner</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 text-sm text-gray-300 mt-4 leading-relaxed">
                                            <p>This scanner tracks stocks showing high-intensity breakouts during market hours, combining volume spikes with significant price movements.</p>
                                            <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                                                <h3 className="font-semibold text-primary mb-2">Key Criteria:</h3>
                                                <ul className="list-disc pl-5 space-y-1 text-gray-400">
                                                    <li>Volume Multiplier: Compares current volume to standard averages</li>
                                                    <li>Price % Move: Real-time price velocity tracking</li>
                                                    <li>Structural Levels: Integration with Balance, Model, and Pattern zones</li>
                                                </ul>
                                            </div>
                                            <p className="italic text-gray-400">Unique signals are captured across the last two trading days to identify both fresh momentum and continuation patterns.</p>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <p className="text-muted-foreground text-sm flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-primary" />
                                High-velocity momentum breakouts with volume confirmation.
                            </p>
                        </div>

                        <div className="relative w-full md:w-80 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Search symbol..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all text-sm backdrop-blur-md"
                            />
                        </div>
                    </div>
                </motion.div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center min-h-[400px]">
                        <Loader2 className="h-10 w-10 text-primary animate-spin" />
                        <p className="mt-4 text-sm text-muted-foreground">Fetching breakout data...</p>
                    </div>
                ) : processedStocks.length === 0 ? (
                    <div className="text-center py-20 bg-white/[0.02] border border-dashed border-white/10 rounded-2xl">
                        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-1">No breakouts detected</h3>
                        <p className="text-sm text-muted-foreground">Check back during market hours for fresh signals.</p>
                    </div>
                ) : (
                    <div className="bg-white/[0.01] border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm shadow-2xl">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-white/[0.03]">
                                    <TableRow className="border-white/5 hover:bg-transparent">
                                        <TableHead onClick={() => toggleSort("symbol")} className="w-[120px] text-[11px] font-black text-white/60 uppercase tracking-widest cursor-pointer hover:text-white transition-colors">
                                            <div className="flex items-center">Symbol {sortField === "symbol" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />)}</div>
                                        </TableHead>
                                        <TableHead onClick={() => toggleSort("date")} className="text-[11px] font-black text-white/60 uppercase tracking-widest cursor-pointer hover:text-white transition-colors">
                                            <div className="flex items-center">Date {sortField === "date" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />)}</div>
                                        </TableHead>
                                        <TableHead onClick={() => toggleSort("time")} className="text-[11px] font-black text-white/60 uppercase tracking-widest cursor-pointer hover:text-white transition-colors">
                                            <div className="flex items-center">Time {sortField === "time" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />)}</div>
                                        </TableHead>
                                        <TableHead onClick={() => toggleSort("close")} className="text-[11px] font-black text-white/60 uppercase tracking-widest cursor-pointer hover:text-white transition-colors text-right">
                                            <div className="flex items-center justify-end">Price {sortField === "close" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />)}</div>
                                        </TableHead>
                                        <TableHead onClick={() => toggleSort("Volume_multiplie")} className="text-[11px] font-black text-white/60 uppercase tracking-widest cursor-pointer hover:text-white transition-colors text-right">
                                            <div className="flex items-center justify-end">Vol Mul {sortField === "Volume_multiplie" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />)}</div>
                                        </TableHead>
                                        <TableHead onClick={() => toggleSort("Price_%_Move")} className="text-[11px] font-black text-white/60 uppercase tracking-widest cursor-pointer hover:text-white transition-colors text-right">
                                            <div className="flex items-center justify-end">Move % {sortField === "Price_%_Move" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />)}</div>
                                        </TableHead>
                                        <TableHead onClick={() => toggleSort("BALANCE")} className="text-[11px] font-black text-white/60 uppercase tracking-widest cursor-pointer hover:text-white transition-colors text-right">
                                            <div className="flex items-center justify-end">Balance {sortField === "BALANCE" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />)}</div>
                                        </TableHead>
                                        <TableHead onClick={() => toggleSort("MODEL")} className="text-[11px] font-black text-white/60 uppercase tracking-widest cursor-pointer hover:text-white transition-colors text-right">
                                            <div className="flex items-center justify-end">Model {sortField === "MODEL" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />)}</div>
                                        </TableHead>
                                        <TableHead onClick={() => toggleSort("PATTERN")} className="text-[11px] font-black text-white/60 uppercase tracking-widest cursor-pointer hover:text-white transition-colors text-right">
                                            <div className="flex items-center justify-end">Pattern {sortField === "PATTERN" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />)}</div>
                                        </TableHead>
                                        <TableHead onClick={() => toggleSort("RESISTANCE")} className="text-[11px] font-black text-white/60 uppercase tracking-widest cursor-pointer hover:text-white transition-colors text-right">
                                            <div className="flex items-center justify-end">Resistance {sortField === "RESISTANCE" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />)}</div>
                                        </TableHead>
                                        <TableHead className="w-[60px] text-[11px] font-black text-white/60 uppercase tracking-widest text-center">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <PremiumProtector requiredTier="pro" blurLevel="md" title="Premium Feature" description="Upgrade to view all Intraday Volume Breakout data.">
                                        {(isFree ? processedStocks.slice(0, 8) : processedStocks).map((stock, idx) => (
                                            <TableRow
                                                key={`${stock.symbol}-${stock.time}-${idx}`}
                                                className="border-white/5 hover:bg-white/[0.04] transition-colors group"
                                            >
                                                {/* Symbol */}
                                                <TableCell className="py-1">
                                                    <span className="text-sm font-black text-white tracking-tight group-hover:text-primary transition-colors">
                                                        {stock.symbol}
                                                    </span>
                                                </TableCell>

                                                {/* Date */}
                                                <TableCell className="py-1">
                                                    <span className="text-[10px] text-muted-foreground font-bold font-mono">
                                                        {stock.date}
                                                    </span>
                                                </TableCell>

                                                {/* Time */}
                                                <TableCell className="py-1">
                                                    <span className="text-[10px] text-muted-foreground font-bold font-mono">
                                                        {stock.time}
                                                    </span>
                                                </TableCell>

                                                {/* Price */}
                                                <TableCell className="py-1 text-right font-black font-mono text-sm">
                                                    ₹{formatNumber(stock.close)}
                                                </TableCell>

                                                {/* Vol Mul */}
                                                <TableCell className="py-1 text-right font-bold font-mono text-xs text-primary/90">
                                                    {Number(stock.Volume_multiplie).toFixed(2)}x
                                                </TableCell>

                                                {/* Move % */}
                                                <TableCell className="py-1 text-right font-bold font-mono text-xs">
                                                    <span className={stock['Price_%_Move'] > 0 ? "text-emerald-400" : stock['Price_%_Move'] < 0 ? "text-rose-400" : "text-white/60"}>
                                                        {stock['Price_%_Move'] > 0 ? '+' : ''}{formatPercent(stock['Price_%_Move'])}
                                                    </span>
                                                </TableCell>

                                                {/* Balance */}
                                                <TableCell className="py-1 text-right font-bold font-mono text-xs text-white/80">
                                                    {stock.BALANCE || '—'}
                                                </TableCell>

                                                {/* Model */}
                                                <TableCell className="py-1 text-right font-bold font-mono text-xs text-white/80">
                                                    {stock.MODEL || '—'}
                                                </TableCell>

                                                {/* Pattern */}
                                                <TableCell className="py-1 text-right font-bold font-mono text-xs text-white/80">
                                                    {stock.PATTERN || '—'}
                                                </TableCell>

                                                {/* Resistance */}
                                                <TableCell className="py-1 text-right font-bold font-mono text-xs text-red-400/80">
                                                    {stock.RESISTANCE || '—'}
                                                </TableCell>

                                                {/* Action */}
                                                <TableCell className="py-1 text-center">
                                                    {stockData?.some(s => s.symbol === stock.symbol) ? (
                                                        <button
                                                            onClick={() => handleStockClick(stock.symbol)}
                                                            className="p-1.5 rounded-lg bg-white/5 hover:bg-primary/20 text-muted-foreground hover:text-white border border-white/5 transition-all outline-none"
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
                    </div>
                )}
            </div>
        </div>
    );
}

export default IntradayBreakout;
