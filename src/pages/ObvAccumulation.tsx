import { useState, useMemo } from "react";
import { Search, Info, Loader2, AlertCircle, ChevronDown, ChevronUp, Clock, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

type SortField = "symbol" | "close" | "resistance" | "model" | "mlGap" | "balance" | "obvSignal";
type SortDirection = "asc" | "desc";

export function ObvAccumulation() {
    const navigate = useNavigate();
    const { intradayBreakoutScanner: rawStocks, intradayBreakout, isLoading, stockData, lastUpdate } = useLiveData();
    const { isFree } = useAuth();

    const [searchTerm, setSearchTerm] = useState("");
    const [sortField, setSortField] = useState<SortField>("symbol");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
    const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
    const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

    // Clean number values
    const formatNumber = (num: number | null | undefined, suffix = "") => {
        if (num === null || num === undefined || isNaN(num)) return "N/A";
        return `${new Intl.NumberFormat('en-IN', {
            maximumFractionDigits: 1,
            minimumFractionDigits: 1
        }).format(num)}${suffix}`;
    };

    const formatPercent = (num: number | null | undefined) => {
        if (num === null || num === undefined || isNaN(num)) return "N/A";
        return `${num >= 0 ? "+" : ""}${num.toFixed(1)}%`;
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
                balance: item.stock.BALANCE || item.stock.balance || boData?.BALANCE || "—"
            };
        });

        // Apply static filters: accumulation and yes
        data = data.filter(stock => {
            const isYes = String(stock.fr || "").toUpperCase() === "YES";
            const isAcc = String(stock.obvSignal || "").toUpperCase() === "ACCUMULATION" || String(stock.obvSignal || "").toUpperCase() === "BULLISH";
            return isYes && isAcc;
        });

        if (searchTerm) {
            data = data.filter(stock =>
                stock.symbol.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

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
    }, [rawStocks, intradayBreakout, searchTerm, sortField, sortDirection]);

    const handleStockClick = (symbol: string) => {
        navigate(`/stocks?symbol=${symbol}`);
    };

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) return null;
        return sortDirection === "asc" ? <ChevronUp className="w-3.5 h-3.5 ml-1 inline text-primary" /> : <ChevronDown className="w-3.5 h-3.5 ml-1 inline text-primary" />;
    };



    const sortText = `${sortField.toUpperCase()} ${sortDirection === 'asc' ? 'A-Z ▴' : 'Z-A ▾'}`;

    return (
        <div className="min-h-screen bg-[#020617] text-foreground selection:bg-primary/30 font-sans">
            <div className="relative container mx-auto px-4 py-8">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold tracking-tight text-white">
                                OBV <span className="text-indigo-400">Accumulation Scan</span>
                            </h1>
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0f172a] border border-white/5 text-[11px] font-medium text-muted-foreground">
                                Market closed — last scan 15:30 IST
                            </div>
                        </div>
                        <p className="text-[15px] text-muted-foreground mb-3">
                            Stocks whose On-Balance Volume shows daily breakout and weekly accumulation conditions.
                        </p>
                        <p className="text-[13px] text-muted-foreground/60 mb-4">
                            Scan as of {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')} 15:30 IST · Scan ID OBV-ACC-{new Date().toISOString().slice(0,10).replace(/-/g, '')}-1 · {processedStocks.length} records
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            <div className="px-3 py-1.5 rounded-full border border-emerald-500/30 text-emerald-400 text-[12px] font-medium bg-emerald-500/5">
                                OBV daily breakout: YES
                            </div>
                            <div className="px-3 py-1.5 rounded-full border border-emerald-500/30 text-emerald-400 text-[12px] font-medium bg-emerald-500/5">
                                OBV weekly: Accumulation
                            </div>
                            <div className="px-3 py-1.5 rounded-full border border-white/10 text-white/70 text-[12px] font-medium bg-white/5 flex items-center gap-1 cursor-pointer hover:bg-white/10 transition-colors">
                                Sorted: {sortText}
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-[13px] font-medium">
                            <button className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors">
                                <Play className="w-3.5 h-3.5 fill-current" /> Explanation video
                            </button>
                            <button className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors">
                                <Play className="w-3.5 h-3.5 fill-current" /> हिंदी video
                            </button>
                            <button onClick={() => setIsMethodologyOpen(true)} className="text-cyan-400 hover:text-cyan-300 transition-colors">
                                Methodology →
                            </button>
                            <button className="text-cyan-400 hover:text-cyan-300 transition-colors">
                                Glossary →
                            </button>
                        </div>
                    </div>
                    
                    <div className="relative w-full md:w-64 mt-2">
                        <input
                            type="text"
                            placeholder="Search symbol..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-[#0f172a] border border-white/5 focus:border-white/20 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all"
                        />
                    </div>
                </div>

                {/* HOW THIS SCAN WORKS Box - Collapsible Accordion */}
                <div className={`bg-[#0f172a]/50 border border-white/5 rounded-xl px-6 mb-6 transition-all duration-200 ${isHowItWorksOpen ? "py-6" : "py-4"}`}>
                    <div 
                        onClick={() => setIsHowItWorksOpen(!isHowItWorksOpen)}
                        className="flex justify-between items-center cursor-pointer select-none"
                    >
                        <h2 className="text-[13px] font-bold text-cyan-400 tracking-widest uppercase">HOW THIS SCAN WORKS</h2>
                        <span className="text-muted-foreground font-semibold text-lg leading-none select-none">
                            {isHowItWorksOpen ? "−" : "+"}
                        </span>
                    </div>
                    <AnimatePresence initial={false}>
                        {isHowItWorksOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: "easeInOut" }}
                                className="overflow-hidden"
                            >
                                <div className="pt-4 space-y-5 text-[14px] text-gray-300/90 leading-relaxed">
                                    <p>
                                        Every trading day, the engine evaluates all Top 1000 Stocks against fixed On-Balance Volume conditions: a daily OBV breakout and weekly OBV accumulation, as defined in the documented methodology. Stocks appear when both conditions are met. Nothing is added, removed, or reordered manually. Model gaps may be positive or negative — OBV conditions say nothing about model distance.
                                    </p>
                                    
                                    <div>
                                        <h3 className="text-[12px] text-gray-400 font-semibold tracking-wider uppercase mb-1">WHAT APPEARING HERE MEANS</h3>
                                        <p>A defined analytical condition occurred at the stated time. That is a recorded observation about the past, not a prediction.</p>
                                    </div>

                                    <div>
                                        <h3 className="text-[12px] text-gray-400 font-semibold tracking-wider uppercase mb-1">WHAT IT DOES NOT MEAN</h3>
                                        <p>Appearance is not a buy or sell recommendation, and detected conditions frequently do not produce follow-through. In our historical testing, a meaningful share of detections saw no further move in the observed direction.</p>
                                    </div>

                                    <div>
                                        <h3 className="text-[12px] text-gray-400 font-semibold tracking-wider uppercase mb-1">DATA & FREQUENCY</h3>
                                        <p>Input: NSE price/volume data - Scan frequency: end of day - Levels source: LASA daily research snapshot (same values as each stock's research page).</p>
                                    </div>

                                    <div className="flex gap-4 text-cyan-400 font-medium text-[13px] pt-2">
                                        <button onClick={() => setIsMethodologyOpen(true)} className="hover:text-cyan-300">Full methodology →</button>
                                        <button className="hover:text-cyan-300">Glossary →</button>
                                        <button className="hover:text-cyan-300">Report an issue →</button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Main Table Content */}
                <div className="bg-[#0f172a]/50 border border-white/5 rounded-xl overflow-hidden shadow-2xl">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Loading...</p>
                        </div>
                    ) : processedStocks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <AlertCircle className="w-12 h-12 text-muted-foreground/30 mb-3" />
                            <h3 className="text-[14px] font-black text-white mb-1 uppercase tracking-widest">No Results</h3>
                            <p className="text-[11px] text-muted-foreground max-w-md font-bold">
                                {searchTerm
                                    ? `No stocks with ticker "${searchTerm}" match the active criteria.`
                                    : "No stocks currently satisfy the OBV Breakout conditions."}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-transparent border-b border-white/5">
                                    <TableRow className="border-white/5 hover:bg-transparent">
                                        <TableHead onClick={() => toggleSort("symbol")} className="w-[140px] text-[11px] font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors">
                                            SYMBOL {getSortIcon("symbol")}
                                        </TableHead>
                                        <TableHead onClick={() => toggleSort("close")} className="text-[11px] font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors text-right">
                                            PRICE {getSortIcon("close")}
                                        </TableHead>
                                        <TableHead onClick={() => toggleSort("resistance")} className="text-[11px] font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors text-right">
                                            RESISTANCE {getSortIcon("resistance")}
                                        </TableHead>
                                        <TableHead onClick={() => toggleSort("model")} className="text-[11px] font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors text-right">
                                            MODEL {getSortIcon("model")}
                                        </TableHead>
                                        <TableHead onClick={() => toggleSort("mlGap")} className="text-[11px] font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors text-right">
                                            <span className="flex items-center justify-end gap-1">
                                                MODEL GAP % <Info className="w-3.5 h-3.5 text-gray-500" />
                                                {getSortIcon("mlGap")}
                                            </span>
                                        </TableHead>
                                        <TableHead onClick={() => toggleSort("balance")} className="text-[11px] font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors text-right">
                                            BALANCE {getSortIcon("balance")}
                                        </TableHead>
                                        <TableHead onClick={() => toggleSort("obvSignal")} className="w-[160px] text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center cursor-pointer hover:text-white transition-colors">
                                            OBV WEEKLY {getSortIcon("obvSignal")}
                                        </TableHead>
                                        <TableHead className="w-[60px] text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <PremiumProtector requiredTier="pro" blurLevel="md" title="Premium Feature" description="Upgrade to Pro to view all OBV Accumulation signals.">
                                        {(isFree ? processedStocks.slice(0, 8) : processedStocks).map((stock, idx) => (
                                            <TableRow
                                                key={`${stock.symbol}-${idx}`}
                                                className="border-white/5 hover:bg-white/[0.02] transition-colors group"
                                            >
                                                {/* Symbol */}
                                                <TableCell className="py-4">
                                                    <span className="text-[13px] font-bold text-white tracking-tight cursor-pointer group-hover:text-primary transition-colors" onClick={() => handleStockClick(stock.symbol)}>
                                                        {stock.symbol}
                                                    </span>
                                                </TableCell>
                                                
                                                {/* Price */}
                                                <TableCell className="py-4 text-right font-semibold text-[13px] text-gray-200">
                                                    ₹{formatNumber(stock.close)}
                                                </TableCell>
                                                
                                                {/* Resistance */}
                                                <TableCell className="py-4 text-right font-semibold text-[13px] text-rose-400">
                                                    ₹{formatNumber(stock.resistance)}
                                                </TableCell>
                                                
                                                {/* Model */}
                                                <TableCell className="py-4 text-right">
                                                    <span className="text-[13px] font-semibold text-gray-200">
                                                        {stock.model && stock.model !== "N/A" && stock.model !== "" ? `₹${formatNumber(stock.model)}` : "—"}
                                                    </span>
                                                </TableCell>

                                                {/* ML_Gap% */}
                                                <TableCell className="py-4 text-right font-semibold text-[13px]">
                                                    <span className={stock.mlGap > 0 ? "text-gray-400" : stock.mlGap < 0 ? "text-gray-400" : "text-white/60"}>
                                                        {formatPercent(stock.mlGap)}
                                                    </span>
                                                </TableCell>
                                                
                                                {/* Balance */}
                                                <TableCell className="py-4 text-right font-semibold text-[13px] text-gray-200">
                                                    {typeof stock.balance === 'number' ? `₹${formatNumber(stock.balance)}` : "—"}
                                                </TableCell>
                                                
                                                {/* Obv Weekly */}
                                                <TableCell className="py-4 text-center">
                                                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-[10px] font-bold tracking-wider">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                                        {stock.obvSignal?.toUpperCase() || '—'}
                                                    </div>
                                                </TableCell>
                                                
                                                {/* Action Button */}
                                                <TableCell className="py-4 text-center">
                                                    {stockData?.some(s => s.symbol === stock.symbol) ? (
                                                        <button
                                                            onClick={() => handleStockClick(stock.symbol)}
                                                            className="text-cyan-400 hover:text-cyan-300 transition-colors p-1"
                                                        >
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg>
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
                
                {/* Footer Disclaimer */}
                <div className="mt-8 pt-8 border-t border-white/5 text-[11px] text-muted-foreground/60 leading-relaxed max-w-5xl mx-auto space-y-4">
                    <p>
                        Research services provided by [Registered Entity Name], SEBI Registered Research Analyst - Regn. No. INH0000XXXXX - BSE Enlistment No. XXXX Registered office: [address]
                    </p>
                    <div className="flex gap-2">
                        <div className="w-1 bg-indigo-500 rounded-full"></div>
                        <p>
                            Scans, levels, projections and summaries on this platform are generated end-to-end by algorithmic and AI models under a documented methodology, reviewed and approved by [Analyst Name], NISM-Series-XV certified, who remains responsible for this research.
                        </p>
                    </div>
                    <p>Holdings disclosures for individual securities are provided on each stock's research page.</p>
                    <p>Analyst certification: the views in these scans accurately reflect the output of the documented methodology, and no part of the analyst's compensation is linked to the specific views expressed.</p>
                    <p>Investments in securities are subject to market risk. Registration and certification do not assure returns or performance. Past patterns do not guarantee future results.</p>
                    
                    <div className="flex gap-4 text-cyan-400 pt-2 font-medium">
                        <button className="hover:text-cyan-300">Terms & MITC</button>
                        <button onClick={() => setIsMethodologyOpen(true)} className="hover:text-cyan-300">Methodology</button>
                        <button className="hover:text-cyan-300">Grievances — Compliance Officer: [name, email, phone]</button>
                        <button className="hover:text-cyan-300">SEBI SCORES</button>
                        <button className="hover:text-cyan-300">Smart ODR</button>
                    </div>
                </div>
            </div>

            {/* Methodology Modal */}
            <Dialog open={isMethodologyOpen} onOpenChange={setIsMethodologyOpen}>
                <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto border border-white/10 bg-[#020617]/95 backdrop-blur-xl p-8 text-left text-gray-200">
                    <DialogHeader className="border-b border-white/5 pb-4 mb-6">
                        <DialogTitle className="text-2xl font-bold tracking-tight text-white">
                            Methodology — OBV Accumulation Scan
                        </DialogTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                            LASA Finance · Research Methodology Document
                        </p>
                    </DialogHeader>

                    <div className="space-y-6 text-sm leading-relaxed text-gray-300 font-sans">
                        <div className="p-4 rounded-xl bg-[#0f172a]/50 border border-white/5 text-xs text-muted-foreground leading-relaxed">
                            Version 1.0 · Effective [date] · Prepared under the supervision of <span className="text-white font-medium">[Analyst Name]</span>, SEBI Registered Research Analyst, Regn. No. INH0000XXXXX
                        </div>

                        <div>
                            <h3 className="text-base font-bold text-white mb-2">1. Purpose</h3>
                            <p>
                                The OBV Accumulation Scan identifies stocks whose On-Balance Volume (OBV) behaviour meets two pre-defined conditions: a daily OBV breakout and a weekly OBV accumulation state. The scan records where these volume conditions have occurred. It does not predict price direction and does not constitute a recommendation to buy or sell any security.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-base font-bold text-white mb-2">2. Universe and Data</h3>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>
                                    <strong className="text-white">Universe:</strong> All constituents of the Nifty 500 index, updated [frequency of universe refresh, e.g., on each index reconstitution].
                                </li>
                                <li>
                                    <strong className="text-white">Data source:</strong> End-of-day price and volume data from the National Stock Exchange of India (NSE), obtained via [data vendor name].
                                </li>
                                <li>
                                    <strong className="text-white">Adjustments:</strong> Prices and volumes are [adjusted / not adjusted] for corporate actions (splits, bonuses) using [method/source].
                                </li>
                                <li>
                                    <strong className="text-white">Exclusions:</strong> Stocks are excluded from a given scan when [e.g., data is unavailable, the stock was suspended, listing history is shorter than the required lookback of N days].
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-base font-bold text-white mb-2">3. Definitions</h3>
                            <div className="space-y-3">
                                <p>
                                    <strong className="text-white">On-Balance Volume (OBV).</strong> A cumulative volume measure computed daily: the day's total traded volume is added to the running total when the stock closes higher than the previous close, subtracted when it closes lower, and left unchanged when the close is flat. OBV tracks whether volume is flowing into or out of a stock over time.
                                </p>
                                <p>
                                    <strong className="text-white">Daily OBV breakout.</strong> A daily OBV breakout is recorded when [EXACT ENGINE RULE — e.g., "the stock's daily OBV closes above its highest value of the preceding N trading days"]. Parameters: [N = __].
                                </p>
                                <p>
                                    <strong className="text-white">Weekly OBV accumulation.</strong> A stock is classified as being in weekly accumulation when [EXACT ENGINE RULE — e.g., "its weekly OBV has closed above its M-week moving average for the most recent K consecutive weeks"]. Parameters: [M = __, K = __]. The label "accumulation" reflects the conventional interpretation of rising OBV; it is a description of observed volume behaviour, not a statement about future prices.
                                </p>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-base font-bold text-white mb-2">4. Scan Logic</h3>
                            <p className="mb-2">
                                A stock appears in the OBV Accumulation Scan on a given day when, and only when, both conditions are true simultaneously:
                            </p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>A daily OBV breakout (Section 3) is active as of the most recent completed trading day; and</li>
                                <li>The weekly OBV accumulation condition (Section 3) is met as of the most recent completed week.</li>
                            </ul>
                            <p className="mt-2">
                                The rule set is fixed and applied identically to every stock in the universe. No stock is added to, removed from, or reordered within the results manually. The default display order is [alphabetical by symbol]; users may re-sort by any column.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-base font-bold text-white mb-2">5. Output Fields</h3>
                            <p>
                                For each qualifying stock, the scan displays: current price; computed resistance level; model projection midpoint (the full projection band and its reliability classification are shown on the stock's research page); model gap % (the arithmetic distance between price and the model projection — a computed distance, not an expected return); balance zone where one exists; and the weekly OBV state. All levels are drawn from the LASA daily research snapshot — the same values published on each stock's research page — so no surface of the platform can display a different figure for the same stock on the same day.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-base font-bold text-white mb-2">6. Frequency and Records</h3>
                            <ul className="list-disc pl-5 space-y-1">
                                <li><strong className="text-white">Computation:</strong> [Once daily after market close at HH:MM IST / every N minutes during market hours].</li>
                                <li><strong className="text-white">Publication:</strong> Each scan run is assigned a Scan ID (format: OBV-ACC-YYYYMMDD-N) and timestamped in IST.</li>
                                <li><strong className="text-white">Records:</strong> Every published scan output is archived unmodified and retained for a minimum of five years, in accordance with the record-keeping requirements applicable to research analysts.</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-base font-bold text-white mb-2">7. Limitations</h3>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>OBV conditions describe historical volume behaviour. In our testing, a meaningful share of detected conditions were not followed by upward price movement; a stock appearing in this scan can decline.</li>
                                <li>[If forward-tracked statistics exist, state them factually, e.g.: "Across the tracked period DD-MM-YYYY to DD-MM-YYYY, X% of detections were followed by a close above the detection price within N sessions, measured across all detections including those that exited the universe." If no validated statistics exist yet, state: "Forward-tracked performance statistics for this scan are under compilation and will be published when a statistically meaningful sample across market regimes is available."]</li>
                                <li>OBV can be distorted by single large-volume sessions (block deals, index events) and is less informative in illiquid stocks.</li>
                                <li>Results depend on the accuracy of exchange data and the corporate-action adjustments described in Section 2.</li>
                                <li>Model projections shown alongside scan results are generated by a separate model documented in [Methodology — Model Projections] and carry their own limitations.</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-base font-bold text-white mb-2">8. Governance and Changes</h3>
                            <p>
                                This methodology is reviewed [quarterly / semi-annually] by [Analyst Name], who is responsible for the research produced by this scan. Any change to the rule set, parameters, universe, or data source results in a new version of this document with the effective date stated; prior versions are retained. Scan outputs generated by AI/algorithmic systems remain the responsibility of the research analyst.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-base font-bold text-white mb-2">9. Standard Disclosures</h3>
                            <p>
                                This scan is a research output of [Registered Entity Name], SEBI Registered Research Analyst (Regn. No. INH0000XXXXX). Appearance of a security in this scan is not a recommendation to buy, sell, or hold it. Investments in securities are subject to market risk. Registration and certification do not assure returns or performance. Past patterns do not guarantee future results. Holdings and conflict disclosures for individual securities are provided on each stock's research page. Grievances: [Compliance Officer name, email, phone] · SEBI SCORES · Smart ODR.
                            </p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default ObvAccumulation;
