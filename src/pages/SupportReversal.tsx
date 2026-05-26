import { useState, useMemo } from "react";
import { Search, ArrowUpRight, Target, Loader2, Sparkles, AlertCircle, TrendingUp, ChevronDown, ChevronUp, Info, PlayCircle, X } from "lucide-react";
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

type SortField = keyof NearResistanceStock;
type SortDirection = "asc" | "desc";

export function SupportReversal() {
    const navigate = useNavigate();
    const { supportReversal: stocks, isLoading } = useLiveData();
    const { isFree } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [sortField, setSortField] = useState<SortField>("dEma200Status");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [showVideoModalHindi, setShowVideoModalHindi] = useState(false);

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
                                <Sparkles className="w-3 h-3" />
                                Screener: Reversals
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-3xl font-bold tracking-tight">
                                        Trend <span className="gradient-text italic">Reversals</span>
                                    </h1>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <button className="p-1 rounded-full hover:bg-white/10 transition-colors text-muted-foreground hover:text-primary">
                                                <Info className="w-5 h-5" />
                                            </button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-[#0f172a]/95 backdrop-blur-xl border-white/10">
                                            <DialogHeader>
                                                <DialogTitle className="text-2xl font-bold gradient-text">Reversal Zone — Stocks Showing Early Turn Signals</DialogTitle>
                                            </DialogHeader>
                                            <div className="space-y-4 text-sm text-gray-300 mt-4 leading-relaxed">
                                                <p>This section highlights stocks that are testing important support or weak zones and showing early signs of a possible reversal.</p>

                                                <p>Our algorithms look for structural exhaustion, loss of downside momentum, and balance shifts to identify areas where selling pressure may be weakening and buyers may start to step in.</p>

                                                <div className="space-y-2">
                                                    <h3 className="text-lg font-semibold text-primary">What this means for traders:</h3>
                                                    <ul className="list-disc pl-5 space-y-1 text-gray-400">
                                                        <li>These stocks are near support or weak structure levels</li>
                                                        <li>Downside risk is clearly defined and relatively small</li>
                                                        <li>Even a modest turn can lead to strong risk-reward opportunities</li>
                                                    </ul>
                                                </div>

                                                <div className="space-y-2">
                                                    <h3 className="text-lg font-semibold text-primary">How to trade this section responsibly:</h3>
                                                    <ul className="space-y-2 text-gray-400">
                                                        <li className="flex gap-2"><span className="text-red-500">📉 Risk control:</span> Place tight stop-loss below support or weak zones. If structure breaks, the reversal thesis is invalid</li>
                                                        <li className="flex gap-2"><span className="text-emerald-500">📈 Upside potential:</span> If price holds and turns, targets are derived from previous Balance areas, resistance zones, or algorithmic levels</li>
                                                        <li className="flex gap-2"><span>⚖️ Context matters:</span> Always align trades with broader market structure and trend. Reversals work best when the overall market is stable or supportive</li>
                                                    </ul>
                                                </div>

                                                <div className="bg-primary/10 p-4 rounded-lg border border-primary/20 space-y-2">
                                                    <h3 className="font-semibold text-primary flex items-center gap-2">Important note:</h3>
                                                    <p>Not every support hold becomes a reversal. That’s why our system focuses on:</p>
                                                    <ul className="list-disc pl-5 space-y-1 text-gray-400">
                                                        <li>Location (support / weak zones)</li>
                                                        <li>Structure confirmation</li>
                                                        <li>Market context</li>
                                                    </ul>
                                                    <p>to help you avoid catching falling knives and take controlled, asymmetric bets.</p>
                                                </div>

                                                <div className="pt-2 border-t border-white/10">
                                                    <p className="italic text-gray-400"><span className="font-semibold text-primary">In simple terms:</span> These are stocks at risk of turning. The loss is small if wrong. The payoff can be meaningful if the turn holds.</p>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        onClick={() => setShowVideoModal(true)}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 hover:border-primary/40 transition-all duration-200 group whitespace-nowrap"
                                        title="Watch Explanation Video"
                                    >
                                        <PlayCircle className="w-4 h-4 text-primary transition-colors" />
                                        <span className="text-[10px] sm:text-xs font-semibold text-primary/90 transition-colors uppercase tracking-wider">Explanation Video</span>
                                    </button>
                                    <button
                                        onClick={() => setShowVideoModalHindi(true)}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 hover:border-orange-500/40 transition-all duration-200 group whitespace-nowrap"
                                        title="हिंदी में देखें"
                                    >
                                        <PlayCircle className="w-4 h-4 text-orange-400 transition-colors" />
                                        <span className="text-[10px] sm:text-xs font-semibold text-orange-400/90 transition-colors uppercase tracking-wider">हिंदी Video</span>
                                    </button>
                                </div>
                            </div>
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

                {
                    isLoading ? (
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
                        <div className="bg-white/[0.01] border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm shadow-2xl">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-white/[0.03]">
                                        <TableRow className="border-white/5 hover:bg-transparent">
                                            <TableHead className="w-[100px] text-[11px] font-black text-white/60 uppercase tracking-widest text-center cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("dEma200Status")}>
                                                EMA200 {sortField === "dEma200Status" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />)}
                                            </TableHead>
                                            <TableHead className="text-[11px] font-black text-white/60 uppercase tracking-widest text-center cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("mlTargetPercent")}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <span className="flex items-center justify-center gap-1">
                                                            Model % {sortField === "mlTargetPercent" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />)}
                                                            <Info className="w-3 h-3 opacity-50" />
                                                        </span>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="w-64 p-3 bg-background border border-white/10 rounded-lg shadow-2xl z-[100] normal-case tracking-normal">
                                                        <p className="text-[10px] text-muted-foreground/90 leading-relaxed font-medium">
                                                            Model % measures the relative distance between the current market price and a model-derived reference level based on historical price structure.
                                                            It is a positional metric used to understand price location within a model framework and does not indicate probability, direction, or potential returns.
                                                        </p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TableHead>
                                            <TableHead className="text-[11px] font-black text-white/60 uppercase tracking-widest cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("id")}>
                                                Symbol {sortField === "id" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />)}
                                            </TableHead>
                                            <TableHead className="text-[11px] font-black text-white/60 uppercase tracking-widest text-right cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("closePrice")}>
                                                Price {sortField === "closePrice" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />)}
                                            </TableHead>
                                            <TableHead className="text-[11px] font-black text-white/60 uppercase tracking-widest text-right cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("resistance")}>
                                                Resistance {sortField === "resistance" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />)}
                                            </TableHead>
                                            <TableHead className="text-[11px] font-black text-white/60 uppercase tracking-widest text-right cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("support")}>
                                                Support {sortField === "support" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />)}
                                            </TableHead>
                                            <TableHead className="text-[11px] font-black text-white/60 uppercase tracking-widest text-right cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("dBreakoutPrice")}>
                                                Breakout {sortField === "dBreakoutPrice" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />)}
                                            </TableHead>
                                            <TableHead className="text-[11px] font-black text-white/60 uppercase tracking-widest text-right cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("algoFG")}>
                                                Balance {sortField === "algoFG" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />)}
                                            </TableHead>
                                            <TableHead className="text-[11px] font-black text-white/60 uppercase tracking-widest text-right cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("algoM")}>
                                                Model {sortField === "algoM" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />)}
                                            </TableHead>
                                            <TableHead className="text-[11px] font-black text-white/60 uppercase tracking-widest text-right cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("algoW")}>
                                                Pattern {sortField === "algoW" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />)}
                                            </TableHead>
                                            <TableHead className="w-[60px] text-[11px] font-black text-white/60 uppercase tracking-widest text-center">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <PremiumProtector requiredTier="pro" blurLevel="md" title="Premium Feature" description="Upgrade to view all Support Reversal data.">
                                            {(isFree ? processedStocks.slice(0, 8) : processedStocks).map((stock) => (
                                                <TableRow key={stock.id} className="border-white/5 hover:bg-white/[0.04] transition-colors group">
                                                    <TableCell className="py-2 text-center">
                                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${stock.dEma200Status === 'ABOVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                                            {stock.dEma200Status}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="py-2 text-center font-bold text-primary tabular-nums text-xs">
                                                        {formatPercent(stock.mlTargetPercent)}
                                                    </TableCell>
                                                    <TableCell className="py-2">
                                                        <span className="text-sm font-black text-white tracking-tight group-hover:text-primary transition-colors">
                                                            {stock.id.replace(/\D/g, '') || stock.id.replace(/[\[\]\(\):-]/g, '')}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="py-2 text-right font-black tabular-nums text-sm">
                                                        ₹{formatNumber(stock.closePrice)}
                                                    </TableCell>
                                                    <TableCell className="py-2 text-right text-red-400 font-bold tabular-nums text-xs">
                                                        ₹{formatNumber(stock.resistance)}
                                                    </TableCell>
                                                    <TableCell className="py-2 text-right text-emerald-400 font-bold tabular-nums text-xs">
                                                        ₹{formatNumber(stock.support)}
                                                    </TableCell>
                                                    <TableCell className="py-2 text-right font-medium tabular-nums text-muted-foreground text-xs">
                                                        ₹{formatNumber(stock.dBreakoutPrice)}
                                                    </TableCell>
                                                    <TableCell className="py-2 text-right font-medium tabular-nums text-xs">
                                                        {formatNumber(stock.algoFG)}
                                                    </TableCell>
                                                    <TableCell className="py-2 text-right font-medium tabular-nums text-xs">
                                                        ₹{formatNumber(stock.algoM)}
                                                    </TableCell>
                                                    <TableCell className="py-2 text-right font-medium tabular-nums text-muted-foreground text-xs">
                                                        ₹{formatNumber(stock.algoW)}
                                                    </TableCell>
                                                    <TableCell className="py-2 text-center">
                                                        <button
                                                            onClick={() => handleStockClick(stock.id)}
                                                            className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-primary hover:text-primary-foreground transition-all"
                                                        >
                                                            <ArrowUpRight className="w-3.5 h-3.5" />
                                                        </button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </PremiumProtector>
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )
                }
            </div >

            {/* Hindi Video Modal - Reversal Screener */}
            {
                showVideoModalHindi && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                        onClick={() => setShowVideoModalHindi(false)}
                    >
                        <div
                            className="relative w-full max-w-4xl bg-background/95 backdrop-blur-xl border border-orange-500/20 rounded-2xl shadow-2xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between p-4 border-b border-white/10">
                                <div className="flex items-center gap-2">
                                    <PlayCircle className="w-5 h-5 text-orange-400" />
                                    <h3 className="text-lg font-semibold text-foreground">Reversal Screener — हिंदी में</h3>
                                </div>
                                <button
                                    onClick={() => setShowVideoModalHindi(false)}
                                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                                >
                                    <X className="w-5 h-5 text-muted-foreground" />
                                </button>
                            </div>
                            <div className="w-full aspect-video bg-black">
                                <iframe
                                    src="https://www.youtube.com/embed/-p_2m2NdkLo?autoplay=1"
                                    title="Reversal Screener Hindi Video"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                    className="w-full h-full"
                                />
                            </div>
                            <div className="p-4 bg-orange-500/5 border-t border-white/10">
                                <p className="text-sm text-muted-foreground text-center italic">
                                    रिवर्सल स्क्रीनर को हिंदी में समझें।
                                </p>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Video Modal */}
            {
                showVideoModal && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                        onClick={() => setShowVideoModal(false)}
                    >
                        <div
                            className="relative w-full max-w-4xl bg-background/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between p-4 border-b border-white/10">
                                <div className="flex items-center gap-2">
                                    <PlayCircle className="w-5 h-5 text-primary" />
                                    <h3 className="text-lg font-semibold text-foreground">Reversal Screener Explanation</h3>
                                </div>
                                <button
                                    onClick={() => setShowVideoModal(false)}
                                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                                >
                                    <X className="w-5 h-5 text-muted-foreground" />
                                </button>
                            </div>

                            <div className="w-full aspect-video bg-black">
                                <iframe
                                    src="https://www.youtube.com/embed/c4tnign5f_Y?autoplay=1"
                                    title="Reversal Screener Explanation Video"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                    className="w-full h-full"
                                />
                            </div>

                            <div className="p-4 bg-primary/5 border-t border-white/10">
                                <p className="text-sm text-muted-foreground text-center italic">
                                    Learn how to identify and trade high-probability reversal setups.
                                </p>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

export default SupportReversal;
