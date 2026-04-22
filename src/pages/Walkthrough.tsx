import { useState, useMemo, useEffect } from "react";
import { Clock, Plus, ChevronUp, ChevronDown, Bell, BellOff, Trash2, ArrowRight, Search, X, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLiveData } from "@/hooks/useLiveData";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface WalkthroughProps {
    isInDropdown?: boolean;
    onClose?: () => void;
}

const ZONE_PRIORITY: Record<string, number> = {
    "BREAKOUT": 1,
    "NEAR RESIST": 2,
    "MID RANGE": 3,
    "NEAR SUPP": 4,
    "AT SUPPORT": 5,
    "BELOW SUPP": 6
};

const Walkthrough = ({ isInDropdown = false, onClose }: WalkthroughProps) => {
    const [isZoneGuideExpanded, setIsZoneGuideExpanded] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [stockToDelete, setStockToDelete] = useState<string | null>(null);
    const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [removingSymbol, setRemovingSymbol] = useState<string | null>(null);
    const { userData, updateUserData } = useAuth();
    const { stockData, nearResistance } = useLiveData();
    const navigate = useNavigate();

    // Alert State
    const [activeAlerts, setActiveAlerts] = useState<string[]>(() => {
        const saved = localStorage.getItem("lasa_watchlist_alerts");
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem("lasa_watchlist_alerts", JSON.stringify(activeAlerts));
    }, [activeAlerts]);

    const handleToggleAlert = async (symbol: string) => {
        if (!activeAlerts.includes(symbol)) {
            // Request permission
            if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
                await Notification.requestPermission();
            }
            setActiveAlerts(prev => [...prev, symbol]);
            toast({ title: "Alert Activated", description: `Monitoring ${symbol} for key levels.` });
        } else {
            setActiveAlerts(prev => prev.filter(s => s !== symbol));
            toast({ title: "Alert Disabled", description: `Stopped monitoring ${symbol}.` });
        }
    };


    const watchlist = userData?.watchlist || [];

    const handleAddStock = async (symbol: string) => {
        if (watchlist.includes(symbol)) {
            setDuplicateWarning(`Stock already exist`);
            setTimeout(() => setDuplicateWarning(null), 3500);
            return;
        }
        setDuplicateWarning(null);
        await updateUserData({ watchlist: [...watchlist, symbol] });
        setIsAdding(false);
        setSearchQuery("");
    };

    const handleRemoveStock = async (symbol: string) => {
        // First show the contextual "Removed" feedback
        setRemovingSymbol(symbol);

        // Wait for visual confirmation before removing from data
        setTimeout(async () => {
            const updated = watchlist.filter(s => s !== symbol);
            await updateUserData({ watchlist: updated });
            setRemovingSymbol(null);
            setStockToDelete(null);
        }, 800);
    };

    // Safe search filtering
    const searchResults = useMemo(() => {
        if (!searchQuery.trim() || !stockData) return [];
        return stockData.filter((s: any) =>
            s?.symbol?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s?.name?.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 10); // Limit results
    }, [searchQuery, stockData]);

    // Aggregate stats for displaying cards based on nearResistance data if available
    const getRenderStats = (symbol: string) => {
        const baseMatch = stockData?.find((s: any) => s.symbol === symbol);
        const nrMatch = nearResistance?.find((s: any) => s.id === symbol || Math.abs(s.id - baseMatch?.price) < 1); // rough fallback

        let price = baseMatch?.price || nrMatch?.closePrice || 0;

        // Find true Support & Resistance by scanning recent history (matching the Chart logic exactly)
        let latestValidSupport = 0;
        let latestValidResist = 0;

        if (baseMatch?.history && Array.isArray(baseMatch.history)) {
            for (let i = baseMatch.history.length - 1; i >= 0; i--) {
                const h = baseMatch.history[i];
                if (latestValidSupport === 0 && h.support > 0) latestValidSupport = h.support;
                if (latestValidResist === 0 && h.resistance > 0) latestValidResist = h.resistance;
                if (latestValidSupport > 0 && latestValidResist > 0) break;
            }
        }

        // Prioritize actual S/R data from the main feed (used by the chart page) to ensure perfect consistency
        let support = latestValidSupport > 0 ? latestValidSupport : (nrMatch?.support ?? price * 0.95);
        let resistance = latestValidResist > 0 ? latestValidResist : (nrMatch?.resistance ?? price * 1.05);

        // Calculate slider position (0 to 100%)
        let percent = 50;
        if (resistance > support && price) {
            percent = ((price - support) / (resistance - support)) * 100;
        }
        percent = Math.max(0, Math.min(100, percent));

        // Determine status badge style based on percent
        let statusText = "MID RANGE";
        let statusColor = "bg-gray-400";
        let isRedBg = false;
        let hasLine = false;

        if (percent > 95) { statusText = "BREAKOUT"; statusColor = "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]"; }
        else if (percent > 80) { statusText = "NEAR RESIST"; statusColor = "bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.4)]"; }
        else if (percent > 30) { statusText = "MID RANGE"; statusColor = "bg-gray-400 shadow-[0_0_10px_rgba(156,163,175,0.4)]"; }
        else if (percent > 10) { statusText = "NEAR SUPP"; statusColor = "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]"; }
        else if (percent > 0) { statusText = "AT SUPPORT"; statusColor = "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]"; isRedBg = true; }
        else { statusText = "BELOW SUPP"; statusColor = "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]"; isRedBg = true; hasLine = true; }

        return {
            price, support, resistance, percent, statusText, statusColor, isRedBg, hasLine,
            m: nrMatch?.algoM || Math.floor(price * 1.1),
            b: nrMatch?.dBreakoutPrice || Math.floor(resistance * 1.02),
            p: nrMatch?.algoW || Math.floor(price * 1.05)
        };
    };

    // Alert Monitoring Engine
    useEffect(() => {
        if (!activeAlerts.length || !stockData) return;

        let triggeredAlerts: string[] = [];

        activeAlerts.forEach(symbol => {
            const stats = getRenderStats(symbol);
            if (!stats.price) return;

            let hitReason = "";

            // Evaluate thresholds (0.2% buffer for precision)
            if (stats.price <= stats.support * 1.002) hitReason = `Support Level (₹${stats.support})`;
            else if (stats.price >= stats.resistance * 0.998) hitReason = `Resistance Level (₹${stats.resistance})`;
            else if (Math.abs(stats.price - stats.m) / stats.m <= 0.002) hitReason = `Model Level (₹${stats.m})`;
            else if (Math.abs(stats.price - stats.b) / stats.b <= 0.002) hitReason = `Balance Level (₹${stats.b})`;
            else if (Math.abs(stats.price - stats.p) / stats.p <= 0.002) hitReason = `Pivot Level (₹${stats.p})`;

            if (hitReason) {
                triggeredAlerts.push(symbol);

                // 1. In-App Toast
                toast({
                    title: `🚨 ${symbol} ALERT`,
                    description: `Hit ${hitReason} at ₹${stats.price}`,
                    variant: "destructive",
                });

                // 2. Browser Notification
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification(`LASA Alert: ${symbol}`, {
                        body: `${symbol} hit ${hitReason} at ₹${stats.price}`,
                    });
                }
            }
        });

        // Auto-turn off triggered alerts
        if (triggeredAlerts.length > 0) {
            setActiveAlerts(prev => prev.filter(s => !triggeredAlerts.includes(s)));
        }
    }, [stockData, nearResistance, activeAlerts]);


    const sortedWatchlist = useMemo(() => {
        if (!sortOrder) return watchlist;

        return [...watchlist].sort((a, b) => {
            const statsA = getRenderStats(a);
            const statsB = getRenderStats(b);

            const priorityA = ZONE_PRIORITY[statsA.statusText] || 99;
            const priorityB = ZONE_PRIORITY[statsB.statusText] || 99;

            if (sortOrder === "asc") return priorityA - priorityB;
            if (sortOrder === "desc") return priorityB - priorityA;

            return 0;
        });
    }, [watchlist, sortOrder, stockData, nearResistance]);

    return (
        <div className={`${isInDropdown ? 'w-full text-sm' : 'container mx-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-2xl min-h-screen'} animation-fade-in text-foreground bg-background font-mono`}>
            {/* Container Wrapper for accurate aesthetics */}
            <div className={`${isInDropdown ? 'border-none bg-transparent' : 'border border-white/10 bg-white/[0.02] rounded-xl overflow-hidden backdrop-blur-md shadow-2xl'}`}>

                {/* Watchlist Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 relative">
                    <span className="font-bold uppercase tracking-wider text-sm flex items-center gap-2 text-foreground/90">
                        ← WATCHLIST
                    </span>
                    <div className="flex items-center gap-4 relative">
                        {duplicateWarning && (
                            <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded animate-fade-in shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                                ⚠ {duplicateWarning}
                            </span>
                        )}
                        <button
                            onClick={() => { setIsAdding(!isAdding); setSearchQuery(""); setDuplicateWarning(null); }}
                            className="flex items-center gap-1 text-sm font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
                        >
                            {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            {isAdding ? "CLOSE" : "ADD"}
                        </button>

                        {onClose && (
                            <>
                                <div className="w-px h-4 bg-white/20 ml-2 mr-1 hidden sm:block" />
                                <button
                                    onClick={onClose}
                                    className="p-1 hover:bg-red-500/20 rounded-full transition-colors text-muted-foreground hover:text-red-400"
                                    title="Close Watchlist"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </>
                        )}

                        {/* Search Dropdown Modal */}
                        {isAdding && (
                            <div className="absolute top-full right-0 mt-2 w-64 md:w-80 bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                                <div className="p-3 border-b border-white/10 flex items-center gap-2 bg-white/5">
                                    <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                                    <input
                                        autoFocus
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search symbol..."
                                        className="w-full bg-transparent focus:outline-none text-sm font-mono placeholder:text-muted-foreground text-foreground"
                                    />
                                </div>
                                <div className="max-h-60 overflow-y-auto">
                                    {searchResults.length === 0 ? (
                                        <div className="p-4 text-xs text-center text-muted-foreground uppercase">
                                            {searchQuery ? "No stocks found" : "Type to search"}
                                        </div>
                                    ) : (
                                        searchResults.map((stock: any) => (
                                            <button
                                                key={stock.symbol}
                                                onClick={() => handleAddStock(stock.symbol)}
                                                className="w-full text-left p-3 border-b border-white/5 hover:bg-white/10 flex items-center justify-between transition-colors"
                                            >
                                                <span className="font-bold text-sm text-foreground/90">{stock.symbol}</span>
                                                <span className="text-xs text-muted-foreground">₹{stock.price}</span>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Disclaimer text */}
                <div className="p-4 border-b border-white/10 bg-primary/5">
                    <div className="flex items-start gap-3 relative">
                        <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-sm sm:text-[15px] text-foreground/90">
                            <span>Short term technical signals only</span>
                            <span className="hidden sm:block opacity-40">|</span>
                            <span>Not a reflection of business quality</span>
                        </div>
                        {/* Glow effect behind clock */}
                        <div className="absolute -left-2 top-0 w-8 h-8 bg-primary/20 rounded-full blur-xl pointer-events-none" />
                    </div>
                </div>

                {/* Zone Guide Toggle */}
                <div className="border-b border-white/10 bg-white/[0.01]">
                    <button
                        onClick={() => setIsZoneGuideExpanded(!isZoneGuideExpanded)}
                        className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-white/[0.03] transition-colors text-left"
                    >
                        <div className="flex items-center gap-6">
                            <span className="font-normal uppercase tracking-widest text-sm text-foreground/90">ZONE GUIDE</span>
                            {!isZoneGuideExpanded && (
                                <div className="flex gap-1.5 items-center">
                                    <div className="w-4 h-4 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                                    <div className="w-4 h-4 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.4)]" />
                                    <div className="w-4 h-4 rounded-full bg-gray-400 shadow-[0_0_8px_rgba(156,163,175,0.4)] border-none" />
                                    <div className="w-4 h-4 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]" />
                                    <div className="w-4 h-4 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                                    <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center shadow-[0_0_8px_rgba(239,68,68,0.4)]">
                                        <div className="w-2h-0.5 bg-white rounded-full" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {isZoneGuideExpanded ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                    </button>

                    {/* Expanded Zone Guide */}
                    {isZoneGuideExpanded && (
                        <div className="p-4 pt-0 space-y-3 bg-white/[0.01]">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-6 sm:gap-6 lg:gap-0 lg:divide-x divide-white/10">

                                {/* Column 1 */}
                                <div className="flex flex-col gap-4 lg:pr-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3.5 h-3.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)] shrink-0" />
                                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
                                            <span className="font-semibold uppercase tracking-wider text-xs w-28 text-foreground">BREAKOUT</span>
                                            <span className="text-muted-foreground text-[11px] whitespace-nowrap">Above resistance</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-3.5 h-3.5 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.4)] shrink-0" />
                                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
                                            <span className="font-semibold uppercase tracking-wider text-xs w-28 text-foreground">NEAR RESIST</span>
                                            <span className="text-muted-foreground text-[11px] whitespace-nowrap">Near ceiling</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Column 2 */}
                                <div className="flex flex-col gap-4 lg:px-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3.5 h-3.5 rounded-full bg-gray-400 shadow-[0_0_8px_rgba(156,163,175,0.4)] shrink-0" />
                                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
                                            <span className="font-semibold uppercase tracking-wider text-xs w-28 text-foreground">MID RANGE</span>
                                            <span className="text-muted-foreground text-[11px] whitespace-nowrap">Between levels</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-3.5 h-3.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)] shrink-0" />
                                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
                                            <span className="font-semibold uppercase tracking-wider text-xs w-28 text-foreground">AT SUPPORT</span>
                                            <span className="text-muted-foreground text-[11px] whitespace-nowrap">On support</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Column 3 */}
                                <div className="flex flex-col gap-4 lg:px-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3.5 h-3.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)] shrink-0" />
                                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
                                            <span className="font-semibold uppercase tracking-wider text-xs w-28 text-foreground">NEAR SUPP</span>
                                            <span className="text-muted-foreground text-[11px] whitespace-nowrap">Near floor</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Column 4 */}
                                <div className="flex flex-col gap-4 lg:pl-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3.5 h-3.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)] flex items-center justify-center shrink-0">
                                            <div className="w-2 h-px bg-white rounded-full" />
                                        </div>
                                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
                                            <span className="font-semibold uppercase tracking-wider text-xs w-28 text-foreground">BELOW SUPP</span>
                                            <span className="text-muted-foreground text-[11px] whitespace-nowrap">Below support</span>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    )}
                </div>

                {/* Watchlist Section Header */}
                <div className="p-4 flex items-center justify-between border-b border-white/10 bg-white/[0.01]">
                    <span className="font-normal uppercase text-sm tracking-widest text-foreground/90">MY STOCKS ({watchlist.length})</span>
                    <div className="relative">
                        <button
                            onClick={() => setIsSortOpen(!isSortOpen)}
                            className={`text-sm font-normal tracking-widest flex items-center gap-1 cursor-pointer transition-colors focus:outline-none ${sortOrder ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
                        >
                            SORT {sortOrder === "asc" ? "(ASC)" : sortOrder === "desc" ? "(DESC)" : "(RANDOM)"}
                        </button>

                        {isSortOpen && (
                            <div className="absolute top-full mt-2 right-0 w-40 bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col py-1">
                                <button onClick={() => { setSortOrder("asc"); setIsSortOpen(false); }} className={`px-4 py-2.5 text-xs font-bold tracking-widest uppercase text-left hover:bg-white/10 ${sortOrder === "asc" ? "text-primary" : "text-muted-foreground"}`}>Ascending</button>
                                <button onClick={() => { setSortOrder("desc"); setIsSortOpen(false); }} className={`px-4 py-2.5 text-xs font-bold tracking-widest uppercase text-left hover:bg-white/10 ${sortOrder === "desc" ? "text-primary" : "text-muted-foreground"}`}>Descending</button>
                                <button onClick={() => { setSortOrder(null); setIsSortOpen(false); }} className={`px-4 py-2.5 text-xs font-bold tracking-widest uppercase text-left hover:bg-white/10 ${sortOrder === null ? "text-primary" : "text-muted-foreground"}`}>Random</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Watchlist Items */}
                {watchlist.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground text-sm tracking-wider uppercase">
                        Your watchlist is empty
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                        <AnimatePresence mode="popLayout">
                            {sortedWatchlist.map((symbol) => {
                                const stats = getRenderStats(symbol);
                                const isDeleting = stockToDelete === symbol;
                                const isCurrentlyRemoving = removingSymbol === symbol;

                                return (
                                    <motion.div
                                        key={symbol}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8, x: -20, transition: { duration: 0.4 } }}
                                        className={`p-3 border border-white/10 rounded-lg transition-colors relative group ${isDeleting ? "bg-red-500/5" : "bg-white/[0.02] hover:bg-white/[0.04]"}`}
                                    >
                                        {/* Contextual "Removed" Pop up inside the card */}
                                        <AnimatePresence>
                                            {isCurrentlyRemoving && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.5 }}
                                                    className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm rounded-lg border border-red-500/50 overflow-hidden"
                                                >
                                                    <div className="flex flex-col items-center gap-2">
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            transition={{ type: "spring", damping: 10 }}
                                                        >
                                                            <Trash2 className="w-8 h-8 text-red-500" />
                                                        </motion.div>
                                                        <span className="text-sm font-black text-red-500 uppercase tracking-[0.2em] animate-pulse">
                                                            REMOVED
                                                        </span>
                                                    </div>
                                                    <div className="absolute -bottom-1 left-0 right-0 h-1 bg-red-500 animate-shrink" style={{ transformOrigin: 'left' }} />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {isDeleting && !isCurrentlyRemoving ? (
                                            <div className="flex flex-col items-center justify-center p-4 min-h-[100px] border border-red-500/20 rounded-lg bg-red-500/10 h-full">
                                                <span className="font-mono text-[11px] text-foreground mb-4 text-center">
                                                    Remove {symbol} from watchlist?
                                                </span>
                                                <div className="flex gap-4">
                                                    <button
                                                        onClick={() => setStockToDelete(null)}
                                                        className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors px-2 py-1 border border-white/10 bg-white/5 rounded"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemoveStock(symbol)}
                                                        className="font-mono text-[10px] uppercase tracking-wider text-red-400 hover:text-red-300 transition-colors px-2 py-1 border border-red-500/20 bg-red-500/10 rounded"
                                                    >
                                                        Confirm
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {/* Top Row */}
                                                <div className="flex flex-wrap items-center justify-between gap-y-2 mb-3">
                                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                                        <span className="font-bold text-primary tracking-wider text-sm truncate max-w-full">{symbol}</span>
                                                        <span className="font-mono text-foreground/90 text-xs shadow-inner bg-black/20 px-2 py-0.5 rounded">₹{stats.price.toLocaleString('en-IN')}</span>
                                                    </div>

                                                    <div className="flex items-center gap-1.5 mt-1 sm:mt-0">
                                                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${stats.statusColor} flex items-center justify-center`}>
                                                            {stats.hasLine && <div className="w-1.5 h-px bg-white rounded-full" />}
                                                        </div>
                                                        <span className="text-[10px] tracking-widest uppercase text-foreground/90 truncate">{stats.statusText}</span>
                                                    </div>
                                                </div>

                                                {/* Slider Row */}
                                                <div className="flex flex-col gap-1.5 my-3 bg-black/10 p-2 rounded-lg">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold tracking-wider text-red-500">S</span>
                                                        <div className="flex-1 h-2 sm:h-2.5 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full relative flex items-center shadow-inner">
                                                            {/* Dot representing current price */}
                                                            <div
                                                                className="absolute w-3.5 h-3.5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] rounded-full z-10"
                                                                style={{ left: `calc(${stats.percent}% - 7px)` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs font-bold tracking-wider text-green-500">R</span>
                                                    </div>
                                                    <div className="flex justify-between px-1">
                                                        <span className="text-[10px] font-mono text-red-400">₹{stats.support.toLocaleString('en-IN')}</span>
                                                        <span className="text-[10px] font-mono text-green-400">₹{stats.resistance.toLocaleString('en-IN')}</span>
                                                    </div>
                                                </div>

                                                {/* Bottom Row */}
                                                <div className="flex items-center justify-between text-[11px] mt-1 border-t border-white/5 pt-2">
                                                    <div className="flex gap-3 text-foreground/70 font-medium">
                                                        <span className="bg-white/5 px-1.5 rounded">M:{stats.m}</span>
                                                        <span className="bg-white/5 px-1.5 rounded">B:{stats.b}</span>
                                                        <span className="bg-white/5 px-1.5 rounded">P:{stats.p}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 opacity-90 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => handleToggleAlert(symbol)}
                                                            title={activeAlerts.includes(symbol) ? "Disable Alert" : "Enable Alert"}
                                                            className={`hover:scale-110 transition-all ${activeAlerts.includes(symbol) ? 'text-yellow-400 animate-pulse' : 'text-white/30 hover:text-yellow-400/50'}`}
                                                        >
                                                            <Bell className={`w-3.5 h-3.5 ${activeAlerts.includes(symbol) ? 'fill-current drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]' : ''}`} />
                                                        </button>
                                                        <button
                                                            onClick={() => setStockToDelete(symbol)}
                                                            className="text-red-400 hover:text-red-300 hover:scale-110 transition-all"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => navigate(`/stocks?symbol=${symbol}`)}
                                                            className="text-primary hover:text-primary/80 hover:scale-110 transition-all"
                                                        >
                                                            <ArrowRight className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Hover Accent effect left bar */}
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-center" />
                                            </>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}

            </div>
        </div>
    );
};

export default Walkthrough;