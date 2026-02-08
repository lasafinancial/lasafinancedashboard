import { useState, useMemo } from "react";
import { Search, ArrowUpRight, Target, Loader2, Sparkles, AlertCircle, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useLiveData } from "@/hooks/useLiveData";
import { NearResistanceStock } from "@/lib/googleSheetsService";

type SortField = keyof NearResistanceStock;
type SortDirection = "asc" | "desc";

export function SupportReversal() {
    const navigate = useNavigate();
    const { supportReversal: stocks, isLoading } = useLiveData();
    const [searchTerm, setSearchTerm] = useState("");
    const [sortField, setSortField] = useState<SortField>("dEma200Status");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

    const formatNumber = (num: number) => {
        if (num === null || num === undefined) return "N/A";
        return new Intl.NumberFormat('en-IN', {
            maximumFractionDigits: 2,
            minimumFractionDigits: 2
        }).format(num);
    };

    const formatPercent = (num: number) => {
        if (num === null || num === undefined) return "N/A";
        return `${(num * 100).toFixed(2)}%`;
    };

    const toggleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    const processedStocks = useMemo(() => {
        if (!stocks) return [];
        let data = [...stocks];

        if (searchTerm) {
            data = data.filter(stock =>
                stock.id.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        data.sort((a, b) => {
            const compareBy = (field: SortField, dir: SortDirection) => {
                const valA = a[field];
                const valB = b[field];
                if (valA < valB) return dir === "asc" ? -1 : 1;
                if (valA > valB) return dir === "asc" ? 1 : -1;
                return 0;
            };

            const fields: SortField[] = [
                "dEma200Status",
                "mlTargetPercent",
                "id",
                "closePrice",
                "resistance",
                "support",
                "dBreakoutPrice",
                "algoFG",
                "algoM",
                "algoW"
            ];

            const order = [sortField, ...fields.filter(f => f !== sortField)];

            for (const field of order) {
                let dir = field === sortField ? sortDirection : "asc";
                // Secondary sort for ML Target % should be descending by default
                if (field === "mlTargetPercent" && field !== sortField) dir = "desc";

                const result = compareBy(field, dir);
                if (result !== 0) return result;
            }
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
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider w-fit">
                                <Sparkles className="w-3 h-3" />
                                Screener: Support (Reversal)
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight">
                                Support <span className="gradient-text italic">Reversal</span>
                            </h1>
                            <p className="text-muted-foreground text-sm flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-primary" />
                                Identifying potential bullish reversals near key support levels.
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
                        <p className="mt-4 text-sm text-muted-foreground">Analyzing market levels...</p>
                    </div>
                ) : processedStocks.length === 0 ? (
                    <div className="text-center py-20 bg-white/[0.02] border border-dashed border-white/10 rounded-2xl">
                        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-1">No stocks found</h3>
                        <p className="text-sm text-muted-foreground">Try adjusting your search or check back later.</p>
                    </div>
                ) : (
                    <div className="flex flex-col h-[calc(100vh-280px)] bg-white/[0.01] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                        <div className="overflow-auto scroll-smooth h-full custom-scrollbar">
                            <div className="min-w-[1200px] flex flex-col gap-2 relative">
                                {/* Header */}
                                <div className="sticky top-0 z-50 bg-[#020617] border-b border-white/10 px-4 py-4 flex items-center text-xs font-semibold text-muted-foreground uppercase tracking-wider shadow-md">
                                    <div className="flex-1 cursor-pointer hover:text-primary transition-colors flex items-center gap-1" onClick={() => toggleSort("id")}>
                                        Symbol {sortField === "id" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                    </div>
                                    <div className="flex-1 cursor-pointer hover:text-primary transition-colors flex items-center gap-1" onClick={() => toggleSort("dEma200Status")}>
                                        EMA200 {sortField === "dEma200Status" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                    </div>
                                    <div className="flex-1 cursor-pointer hover:text-primary transition-colors flex items-center gap-1" onClick={() => toggleSort("closePrice")}>
                                        Price {sortField === "closePrice" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                    </div>
                                    <div className="flex-1 cursor-pointer hover:text-primary transition-colors flex items-center gap-1" onClick={() => toggleSort("resistance")}>
                                        Resistance {sortField === "resistance" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                    </div>
                                    <div className="flex-1 cursor-pointer hover:text-primary transition-colors flex items-center gap-1" onClick={() => toggleSort("support")}>
                                        Support {sortField === "support" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                    </div>
                                    <div className="flex-1 cursor-pointer hover:text-primary transition-colors flex items-center gap-1" onClick={() => toggleSort("dBreakoutPrice")}>
                                        Breakout {sortField === "dBreakoutPrice" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                    </div>
                                    <div className="flex-1 text-right cursor-pointer hover:text-primary transition-colors flex items-center justify-end gap-1" onClick={() => toggleSort("mlTargetPercent")}>
                                        Model % {sortField === "mlTargetPercent" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                    </div>
                                    <div className="flex-1 text-right cursor-pointer hover:text-primary transition-colors flex items-center justify-end gap-1" onClick={() => toggleSort("algoFG")}>
                                        Algo FG {sortField === "algoFG" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                    </div>
                                    <div className="flex-1 text-right cursor-pointer hover:text-primary transition-colors flex items-center justify-end gap-1" onClick={() => toggleSort("algoM")}>
                                        Algo M {sortField === "algoM" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                    </div>
                                    <div className="flex-1 text-right pr-4 cursor-pointer hover:text-primary transition-colors flex items-center justify-end gap-1" onClick={() => toggleSort("algoW")}>
                                        Algo W {sortField === "algoW" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                    </div>
                                    <div className="flex-[0.5]"></div>
                                </div>

                                {/* Rows */}
                                <div className="flex flex-col gap-2 p-2">
                                    {processedStocks.map((stock) => (
                                        <motion.div
                                            layout
                                            initial={{ opacity: 0, scale: 0.98 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            key={stock.id}
                                            className="group"
                                        >
                                            <GlassCard className="p-0 border-white/5 hover:border-primary/30 transition-all duration-300 group-hover:bg-white/[0.03]">
                                                <div className="flex items-center w-full px-4 py-4">
                                                    <div className="flex-1 flex items-center gap-3">
                                                        <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                                                            <Target className="w-4 h-4 text-primary" />
                                                        </div>
                                                        <span className="font-bold tracking-tight">
                                                            {stock.id.replace(/\D/g, '') || stock.id.replace(/[\[\]\(\):-]/g, '')}
                                                        </span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${stock.dEma200Status === 'ABOVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                                            {stock.dEma200Status}
                                                        </span>
                                                    </div>
                                                    <div className="flex-1 font-semibold tabular-nums text-sm md:text-base">₹{formatNumber(stock.closePrice)}</div>
                                                    <div className="flex-1 text-red-400 font-medium tabular-nums text-sm md:text-base">₹{formatNumber(stock.resistance)}</div>
                                                    <div className="flex-1 text-emerald-400 font-medium tabular-nums text-sm md:text-base">₹{formatNumber(stock.support)}</div>
                                                    <div className="flex-1 font-medium tabular-nums text-muted-foreground text-sm md:text-base">₹{formatNumber(stock.dBreakoutPrice)}</div>
                                                    <div className="flex-1 text-right font-bold text-primary tabular-nums">{formatPercent(stock.mlTargetPercent)}</div>
                                                    <div className="flex-1 text-right font-medium tabular-nums text-sm md:text-base">{formatNumber(stock.algoFG)}</div>
                                                    <div className="flex-1 text-right font-medium tabular-nums text-sm md:text-base">₹{formatNumber(stock.algoM)}</div>
                                                    <div className="flex-1 text-right font-medium tabular-nums text-muted-foreground text-sm md:text-base pr-4">₹{formatNumber(stock.algoW)}</div>
                                                    <div className="flex-[0.5] flex justify-end">
                                                        <button
                                                            onClick={() => handleStockClick(stock.id)}
                                                            className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-primary hover:text-primary-foreground transition-all group-hover:scale-110"
                                                        >
                                                            <ArrowUpRight className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </GlassCard>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SupportReversal;
