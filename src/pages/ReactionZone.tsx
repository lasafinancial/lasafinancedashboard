import { useState, useMemo } from "react";
import { Search, ArrowUpRight, Target, Loader2, Sparkles, AlertCircle, TrendingUp, ChevronDown, ChevronUp, Info, Activity } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useLiveData } from "@/hooks/useLiveData";
import { NearResistanceStock } from "@/lib/googleSheetsService";

type SortField = keyof NearResistanceStock;
type SortDirection = "asc" | "desc";

export function ReactionZone() {
    const navigate = useNavigate();
    const { reactionZone: stocks, isLoading } = useLiveData();
    const [searchTerm, setSearchTerm] = useState("");
    const [sortField, setSortField] = useState<SortField>("mlTargetPercent");
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
                "mlTargetPercent",
                "dEma200Status",
                "id",
                "closePrice",
                "resistance",
                "support",
                "changePercent",
                "algoFG",
                "algoM",
                "algoW"
            ];

            const order = [sortField, ...fields.filter(f => f !== sortField)];

            for (const field of order) {
                let dir = field === sortField ? sortDirection : "asc";
                // Secondary sort for ML Target % should be descending by default
                if (field === "mlTargetPercent" && field !== sortField) dir = "desc";
                // Secondary sort for Change % should also be descending by default
                if (field === "changePercent" && field !== sortField) dir = "desc";

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
                {/* Screener Top Disclaimer */}
                <div className="mb-8 p-3 rounded-xl bg-primary/5 border border-primary/10 text-center max-w-4xl mx-auto">
                    <p className="text-[11px] md:text-xs text-muted-foreground/80 leading-relaxed font-medium">
                        Stocks shown are filtered based on the selected analytical criteria and do not constitute buy or sell recommendations. No ranking or prioritization is implied.
                    </p>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider w-fit">
                                <Activity className="w-3 h-3" />
                                Screener: Reaction Zone
                            </div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold tracking-tight">
                                    Reaction <span className="gradient-text italic">Zone</span>
                                </h1>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <button className="p-1 rounded-full hover:bg-white/10 transition-colors text-muted-foreground hover:text-primary">
                                            <Info className="w-5 h-5" />
                                        </button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-[#0f172a]/95 backdrop-blur-xl border-white/10">
                                        <DialogHeader>
                                            <DialogTitle className="text-2xl font-bold gradient-text">Reaction Zone — Trading at Key Levels</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 text-sm text-gray-300 mt-4 leading-relaxed">
                                            <p>This screener identifies stocks that are trading in close proximity (±1%) to key algorithmic levels: Balance, Model, or Pattern.</p>

                                            <p>These levels often act as significant support or resistance, where price action tends to react strongly. Trading near these zones offers defined risk and high reward potential.</p>

                                            <div className="space-y-2">
                                                <h3 className="text-lg font-semibold text-primary">Key Levels Monitored:</h3>
                                                <ul className="list-disc pl-5 space-y-1 text-gray-400">
                                                    <li><span className="text-white font-medium">Balance:</span> Fibonacci/Gann confluence level</li>
                                                    <li><span className="text-white font-medium">Model:</span> Monthly pivotal level</li>
                                                    <li><span className="text-white font-medium">Pattern:</span> Weekly pivotal level</li>
                                                </ul>
                                            </div>

                                            <div className="pt-2 border-t border-white/10">
                                                <p className="italic text-gray-400"><span className="font-semibold text-primary">Strategy:</span> Look for price action confirmation (candles/volume) at these levels for reversals or breakouts.</p>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <p className="text-muted-foreground text-sm flex items-center gap-2">
                                <Target className="w-4 h-4 text-primary" />
                                Stocks trading within 1% of key algorithmic levels.
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
                        <p className="mt-4 text-sm text-muted-foreground">Scanning reaction zones...</p>
                    </div>
                ) : processedStocks.length === 0 ? (
                    <div className="text-center py-20 bg-white/[0.02] border border-dashed border-white/10 rounded-2xl">
                        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-1">No stocks in zone</h3>
                        <p className="text-sm text-muted-foreground">No stocks are currently within 1% of monitored algo levels.</p>
                    </div>
                ) : (
                    <div className="flex flex-col h-[calc(100vh-280px)] bg-white/[0.01] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                        <div className="overflow-auto scroll-smooth h-full custom-scrollbar">
                            <div className="min-w-[1200px] flex flex-col gap-2 relative">
                                {/* Header */}
                                <div className="sticky top-0 z-50 bg-[#020617] border-b border-white/10 px-3 py-3 md:px-4 md:py-4 flex items-center text-xs font-semibold text-muted-foreground uppercase tracking-wider shadow-md">
                                    <div className="flex-1 cursor-pointer hover:text-primary transition-colors flex items-center gap-1" onClick={() => toggleSort("dEma200Status")}>
                                        EMA200 {sortField === "dEma200Status" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                    </div>
                                    <div className="flex-1 cursor-pointer hover:text-primary transition-colors flex items-center gap-1" onClick={() => toggleSort("mlTargetPercent")}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="flex items-center gap-1">
                                                    Model % {sortField === "mlTargetPercent" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                                    <Info className="w-3 h-3 ml-0.5 opacity-50" />
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent className="w-64 p-3 bg-background border border-white/10 rounded-lg shadow-2xl z-[100] normal-case tracking-normal">
                                                <p className="text-[10px] text-muted-foreground/90 leading-relaxed font-medium">
                                                    Model % measures the relative distance between the current market price and a model-derived reference level based on historical price structure.
                                                    It is a positional metric used to understand price location within a model framework and does not indicate probability, direction, or potential returns.
                                                </p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                    <div className="flex-1 cursor-pointer hover:text-primary transition-colors flex items-center gap-1" onClick={() => toggleSort("id")}>
                                        Stocks {sortField === "id" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
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
                                    <div className="flex-1 cursor-pointer hover:text-primary transition-colors flex items-center gap-1" onClick={() => toggleSort("changePercent")}>
                                        Change % {sortField === "changePercent" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                    </div>
                                    <div className="flex-1 text-right cursor-pointer hover:text-primary transition-colors flex items-center justify-end gap-1" onClick={() => toggleSort("algoFG")}>
                                        Balance {sortField === "algoFG" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                    </div>
                                    <div className="flex-1 text-right cursor-pointer hover:text-primary transition-colors flex items-center justify-end gap-1" onClick={() => toggleSort("algoM")}>
                                        Model {sortField === "algoM" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                    </div>
                                    <div className="flex-1 text-right pr-4 cursor-pointer hover:text-primary transition-colors flex items-center justify-end gap-1" onClick={() => toggleSort("algoW")}>
                                        Pattern {sortField === "algoW" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
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
                                                <div className="flex items-center w-full px-3 py-3 md:px-4 md:py-4">
                                                    <div className="flex-1">
                                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${stock.dEma200Status === 'ABOVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                                            {stock.dEma200Status}
                                                        </span>
                                                    </div>
                                                    <div className="flex-1 font-bold text-primary tabular-nums">{formatPercent(stock.mlTargetPercent)}</div>
                                                    <div className="flex-1 flex items-center gap-2">
                                                        <span className="font-bold tracking-tight text-sm md:text-base">
                                                            {stock.id.replace(/\D/g, '') || stock.id.replace(/[\[\]\(\):-]/g, '')}
                                                        </span>
                                                    </div>
                                                    <div className="flex-1 font-semibold tabular-nums text-sm md:text-base">₹{formatNumber(stock.closePrice)}</div>
                                                    <div className="flex-1 text-red-400 font-medium tabular-nums text-sm md:text-base">₹{formatNumber(stock.resistance)}</div>
                                                    <div className="flex-1 text-emerald-400 font-medium tabular-nums text-sm md:text-base">₹{formatNumber(stock.support)}</div>
                                                    <div className={`flex-1 font-medium tabular-nums text-sm md:text-base ${(stock.changePercent ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                        {formatPercent(stock.changePercent ?? 0)}
                                                    </div>
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

export default ReactionZone;
