import { useState, useMemo } from "react";
import { Clock, Plus, ChevronUp, ChevronDown, Bell, BellOff, Trash2, ArrowRight, Search, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLiveData } from "@/hooks/useLiveData";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

interface WalkthroughProps {
    isInDropdown?: boolean;
}

const Walkthrough = ({ isInDropdown = false }: WalkthroughProps) => {
    const [isZoneGuideExpanded, setIsZoneGuideExpanded] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [stockToDelete, setStockToDelete] = useState<string | null>(null);
    const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
    const { userData, updateUserData } = useAuth();
    const { stockData, nearResistance } = useLiveData();
    const navigate = useNavigate();

    const watchlist = userData?.watchlist || [];

    const handleAddStock = async (symbol: string) => {
        if (watchlist.includes(symbol)) {
            setDuplicateWarning(`Stock already exist`);
            setTimeout(() => setDuplicateWarning(null), 3500);
            return;
        }
        setDuplicateWarning(null);
        await updateUserData({ watchlist: [...watchlist, symbol] });
        toast({ title: "Added", description: `${symbol} added to Watchlist.` });
        setIsAdding(false);
        setSearchQuery("");
    };

    const handleRemoveStock = async (symbol: string) => {
        const updated = watchlist.filter(s => s !== symbol);
        await updateUserData({ watchlist: updated });
        toast({ title: "Removed", description: `${symbol} removed from Watchlist.` });
        setStockToDelete(null);
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

        // Simulate zones based on image styles and provided nearResistance data
        let support = nrMatch?.support || price * 0.95;
        let resistance = nrMatch?.resistance || price * 1.05;

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

    return (
        <div className={`${isInDropdown ? 'w-full text-sm' : 'container mx-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-2xl min-h-screen'} animation-fade-in text-foreground bg-background font-mono`}>
            {/* Container Wrapper for accurate aesthetics */}
            <div className={`${isInDropdown ? 'border-none bg-transparent' : 'border border-white/10 bg-white/[0.02] rounded-xl overflow-hidden backdrop-blur-md shadow-2xl'} px-1 sm:px-0`}>

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

                        {/* Search Dropdown Modal */}
                        {isAdding && (
                            <div className="absolute top-full right-0 mt-2 w-[280px] sm:w-[320px] md:w-80 bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
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
                        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0 mt-0.5" />
                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-x-3 gap-y-0.5 font-mono text-[10px] sm:text-[14px] text-foreground/90">
                            <span className="whitespace-nowrap">Short term technical signals ONLY</span>
                            <span className="hidden sm:block opacity-40">|</span>
                            <span className="whitespace-nowrap">Not individual stock advice</span>
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
                                        <div className="w-2 h-0.5 bg-white rounded-full" />
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
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-2 md:gap-x-0 md:divide-x divide-white/10">

                                {/* Column 1 */}
                                <div className="flex flex-col gap-3 md:pr-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)] shrink-0" />
                                        <div className="flex flex-col">
                                            <span className="font-semibold uppercase tracking-wider text-[10px] text-foreground">BREAKOUT</span>
                                            <span className="text-muted-foreground text-[9px] truncate">Above resistance</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.4)] shrink-0" />
                                        <div className="flex flex-col">
                                            <span className="font-semibold uppercase tracking-wider text-[10px] text-foreground">NEAR RESIST</span>
                                            <span className="text-muted-foreground text-[9px] truncate">Near ceiling</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Column 2 */}
                                <div className="flex flex-col gap-3 md:px-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-gray-400 shadow-[0_0_8px_rgba(156,163,175,0.4)] shrink-0" />
                                        <div className="flex flex-col">
                                            <span className="font-semibold uppercase tracking-wider text-[10px] text-foreground">MID RANGE</span>
                                            <span className="text-muted-foreground text-[9px] truncate">Between levels</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)] shrink-0" />
                                        <div className="flex flex-col">
                                            <span className="font-semibold uppercase tracking-wider text-[10px] text-foreground">AT SUPPORT</span>
                                            <span className="text-muted-foreground text-[9px] truncate">On support</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Column 3 */}
                                <div className="flex flex-col gap-3 md:px-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)] shrink-0" />
                                        <div className="flex flex-col">
                                            <span className="font-semibold uppercase tracking-wider text-[10px] text-foreground">NEAR SUPP</span>
                                            <span className="text-muted-foreground text-[9px] truncate">Near floor</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Column 4 */}
                                <div className="flex flex-col gap-3 md:pl-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)] flex items-center justify-center shrink-0">
                                            <div className="w-1.5 h-px bg-white rounded-full" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-semibold uppercase tracking-wider text-[10px] text-foreground">BELOW SUPP</span>
                                            <span className="text-muted-foreground text-[9px] truncate">Below support</span>
                                        </div>
                                    </div>
                                </div>

                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
                                <span className="font-semibold uppercase tracking-wider text-xs w-28 text-foreground">BELOW SUPP</span>
                                <span className="text-muted-foreground text-[11px] whitespace-nowrap">Below support</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Watchlist Section Header */}
                <div className="p-4 flex items-center justify-between border-b border-white/10 bg-white/[0.01]">
                    <span className="font-normal uppercase text-sm tracking-widest text-foreground/90">MY STOCKS ({watchlist.length})</span>
                    <span className="text-sm font-normal tracking-widest flex items-center gap-1 cursor-pointer text-muted-foreground hover:text-primary transition-colors">
                        SORT ↕
                    </span>
                </div>

                {/* Watchlist Items */}
                {
                    watchlist.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground text-sm tracking-wider uppercase">
                            Your watchlist is empty
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 p-2 sm:p-4">
                            {watchlist.map((symbol) => {
                                const stats = getRenderStats(symbol);
                                const isDeleting = stockToDelete === symbol;

                                return (
                                    <div key={symbol} className={`p-3 border border-white/10 rounded-lg transition-colors relative group ${isDeleting ? "bg-red-500/5" : "bg-white/[0.02] hover:bg-white/[0.04]"}`}>

                                        {isDeleting ? (
                                            <div className="flex flex-col items-center justify-center p-4 min-h-[100px] border border-red-500/20 rounded-lg bg-red-500/10">
                                                <span className="font-mono text-sm text-foreground mb-4">
                                                    Remove {symbol} from watchlist?
                                                </span>
                                                <div className="flex gap-4">
                                                    <button
                                                        onClick={() => setStockToDelete(null)}
                                                        className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
                                                    >
                                                        [Cancel]
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemoveStock(symbol)}
                                                        className="font-mono text-sm text-red-400 hover:text-red-300 transition-colors px-2 py-1"
                                                    >
                                                        [Remove]
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {/* Top Row */}
                                                <div className="flex flex-wrap items-center justify-between gap-y-2 mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-bold text-primary tracking-wider text-sm">{symbol}</span>
                                                        <span className="font-mono text-foreground/90 text-xs shadow-inner bg-black/20 px-2 py-0.5 rounded">₹{stats.price.toLocaleString('en-IN')}</span>
                                                    </div>

                                                    <div className="flex items-center gap-1.5">
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
                                                        <button className="text-yellow-400 hover:text-yellow-300 hover:scale-110 transition-all">
                                                            <Bell className="w-3.5 h-3.5 fill-current drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]" />
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
                                    </div>
                                );
                            })}
                        </div>
                    )
                }
            </div>
        </div>
    );
};

export default Walkthrough;
