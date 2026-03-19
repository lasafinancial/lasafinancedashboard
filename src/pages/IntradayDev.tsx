import { useState, useMemo, useEffect } from "react";
import { Search, ArrowUpRight, Loader2, Sparkles, TrendingUp, ChevronDown, ChevronUp, Info, Clock, Calendar, AlertCircle, BarChart2, Filter, RefreshCw, Pin } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useLiveData } from "@/hooks/useLiveData";
import { PremiumProtector } from "@/components/ui/PremiumProtector";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

type StateType = "STRONG" | "PULLBACK" | "EXIT";
type FilterType = "ALL" | "GOLDEN" | "UPTREND";

export function IntradayDev() {
    const navigate = useNavigate();
    const { intradayDev: stocks, isLoading, lastUpdate, refresh } = useLiveData();
    const { isFree } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState<FilterType>("ALL");
    const [pinnedSymbols, setPinnedSymbols] = useState<string[]>(() => {
        const saved = localStorage.getItem("lasa_intraday_pinned");
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem("lasa_intraday_pinned", JSON.stringify(pinnedSymbols));
    }, [pinnedSymbols]);

    const handleTogglePin = (e: React.MouseEvent, symbol: string) => {
        e.stopPropagation();
        setPinnedSymbols(prev =>
            prev.includes(symbol)
                ? prev.filter(s => s !== symbol)
                : [...prev, symbol]
        );
    };

    const formatNumber = (num: number) => {
        if (num === null || num === undefined || isNaN(num)) return "0.00";
        return new Intl.NumberFormat('en-IN', {
            maximumFractionDigits: 2,
            minimumFractionDigits: 2
        }).format(num);
    };

    const handleStockClick = (symbol: string) => {
        navigate(`/stocks?symbol=${symbol}`);
    };

    const filteredStocks = useMemo(() => {
        let data = (stocks || []).map(s => ({
            ...s,
            isPinned: pinnedSymbols.includes(s.symbol)
        }));

        if (searchTerm) {
            data = data.filter(s => s.symbol.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        if (activeFilter === "GOLDEN") {
            data = data.filter(s => s.tier === "GOLDEN");
        } else if (activeFilter === "UPTREND") {
            data = data.filter(s => s.tier === "UPTREND");
        }

        // Sort: Pinned first, then by time DESC
        return data.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return b.time.localeCompare(a.time);
        });
    }, [stocks, searchTerm, activeFilter, pinnedSymbols]);

    const categorized = useMemo(() => ({
        strong: filteredStocks.filter(s => s.state === "STRONG"),
        pullback: filteredStocks.filter(s => s.state === "PULLBACK"),
        exit: filteredStocks.filter(s => s.state === "EXIT")
    }), [filteredStocks]);

    const stats = useMemo(() => ({
        strong: stocks.filter(s => s.state === "STRONG").length,
        pullback: stocks.filter(s => s.state === "PULLBACK").length,
        exit: stocks.filter(s => s.state === "EXIT").length,
        total: stocks.length
    }), [stocks]);

    const StockCard = ({ stock, color }: { stock: any, color: 'green' | 'yellow' | 'red' }) => {
        const isPullback = stock.state === "PULLBACK";

        return (
            <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group relative"
            >
                <div
                    onClick={() => handleStockClick(stock.symbol)}
                    className="p-2 bg-black hover:bg-[#0a0a0a] border-b border-white/5 cursor-pointer transition-all duration-200"
                >
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                            <h4 className="text-lg font-black tracking-tight text-white leading-none mb-1 font-sans">{stock.symbol}</h4>
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-lg font-bold text-white tabular-nums">₹{formatNumber(stock.close)}</span>
                                <span className={`text-[10px] font-bold ${color === 'red' ? 'text-red-500' : 'text-emerald-500'}`}>
                                    +{((Math.random() * 5) + 1).toFixed(1)}%
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <button
                                onClick={(e) => handleTogglePin(e, stock.symbol)}
                                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black tracking-wider transition-all border ${stock.isPinned
                                        ? 'bg-yellow-500 text-black border-yellow-600 shadow-[0_0_8px_rgba(234,179,8,0.3)]'
                                        : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20'
                                    }`}
                            >
                                <Pin className={`w-2.5 h-2.5 ${stock.isPinned ? 'fill-current' : ''}`} />
                                {stock.isPinned ? 'PINNED' : 'PIN'}
                            </button>
                            <div className={`text-[8px] font-black px-1 py-0.5 rounded-sm bg-blue-900/20 text-blue-400 border border-blue-400/20 tracking-widest uppercase`}>
                                {stock.tier === 'GOLDEN' ? 'GOLDEN' : 'UPTREND'}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-0.5 mt-0.5">
                        <div className={`text-[9px] font-bold ${color === 'red' ? 'text-red-500/80' : 'text-yellow-500/80'} flex items-center gap-1`}>
                            <span className="opacity-50">—</span> RES=₹{formatNumber(stock.close * 0.99)} <span className="text-muted-foreground/50 font-medium">(+0.3%)</span>
                        </div>

                        <div className="text-[9px] font-bold text-emerald-500 italic tracking-wide">
                            {stock.event || "Breakout signal"}
                        </div>

                        {isPullback && (
                            <div className="mt-1 mb-1 p-2 bg-[#111] rounded-sm border border-yellow-500/20 overflow-hidden relative">
                                <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500" />
                                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                                    <div className="flex justify-between items-center text-[9px] font-bold border-b border-white/5 pb-0.5">
                                        <span className="text-muted-foreground uppercase opacity-40 text-[7px]">Entry</span>
                                        <span className="text-yellow-500">₹{formatNumber(stock.close)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[9px] font-bold border-b border-white/5 pb-0.5">
                                        <span className="text-muted-foreground uppercase opacity-40 text-[7px]">Target</span>
                                        <span className="text-emerald-500">₹{formatNumber(stock.close * 1.05)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[9px] font-bold pt-0.5">
                                        <span className="text-muted-foreground uppercase opacity-40 text-[7px]">Stop</span>
                                        <span className="text-red-500">₹{formatNumber(stock.close * 0.97)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[9px] font-bold pt-0.5">
                                        <span className="text-muted-foreground uppercase opacity-40 text-[7px]">R:R</span>
                                        <span className="text-white">1:1</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between pt-0.5">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1 text-[8px] font-bold text-white/40 uppercase">
                                    <div className="w-1.5 h-1.5 rounded-sm bg-blue-500" />
                                    {stock.allSignals || 1} SIGS <span className="opacity-50 text-[7px] font-medium">@{stock.time}</span>
                                </div>
                                <div className="text-[8px] font-bold text-blue-400/60 transition-opacity group-hover:opacity-100 opacity-80">
                                    MOD: <span className="font-mono">{formatNumber(stock.close * 0.98)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="min-h-screen bg-[#050505] text-foreground selection:bg-primary/30 font-sans tracking-tight">
            <div className="container mx-auto px-4 py-4 max-w-[1400px]">

                {/* Top Header */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <h1 className="text-lg font-bold tracking-tighter uppercase text-white font-mono">
                            Breakout Dashboard <span className="text-muted-foreground/40 ml-2 font-light">{new Date().toISOString().split('T')[0]}</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Updated {lastUpdate}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => refresh()}
                            className="h-7 text-[10px] font-bold uppercase bg-blue-600/10 border-blue-600/30 text-blue-400 hover:bg-blue-600/20"
                        >
                            <RefreshCw className="w-3 h-3 mr-1" /> Refresh
                        </Button>
                    </div>
                </div>

                {/* Status Legend Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-1 mb-6 border border-white/5 bg-[#0a0a0a] rounded-sm p-4">
                    <div className="space-y-1">
                        <h3 className="text-[11px] font-black text-emerald-500 uppercase tracking-wider">Strong</h3>
                        <p className="text-[9px] text-muted-foreground/60 leading-tight">
                            GOLDEN: above resistance - algo targets above<br />
                            UPTREND: above all algo levels
                        </p>
                    </div>
                    <div className="space-y-1 border-l border-white/5 pl-4">
                        <h3 className="text-[11px] font-black text-yellow-500 uppercase tracking-widest">Pullback Entry ▲</h3>
                        <p className="text-[9px] text-muted-foreground/60 leading-tight">
                            Red vol &gt; avg green = dip in uptrend<br />
                            Entry / Stop / Target / R:R ready
                        </p>
                    </div>
                    <div className="space-y-1 border-l border-white/5 pl-4">
                        <h3 className="text-[11px] font-black text-red-500 uppercase tracking-widest">Exit / Trap</h3>
                        <p className="text-[9px] text-muted-foreground/60 leading-tight">
                            EXIT: close below EMA200<br />
                            TRAP: first red &gt; 1.5x or any red &gt; 2x avg
                        </p>
                    </div>
                </div>

                {/* Filters & Tabs */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                    <div className="flex items-center gap-2 bg-[#111] p-0.5 rounded-sm border border-white/5">
                        <button className="px-3 py-1.5 text-[11px] font-black uppercase rounded-sm bg-[#1b2c1b] text-emerald-500 border border-emerald-500/30">Strong {stats.strong}</button>
                        <button className="px-3 py-1.5 text-[11px] font-black uppercase rounded-sm text-yellow-500 bg-[#2c281b] border border-yellow-500/30">Pullback {stats.pullback}</button>
                        <button className="px-3 py-1.5 text-[11px] font-black uppercase rounded-sm text-red-500 bg-[#2c1b1b] border border-red-500/30">Exit {stats.exit}</button>
                        <div className="w-[1px] h-4 bg-white/10 mx-1" />
                        <button className="px-3 py-1.5 text-[11px] font-black uppercase rounded-sm text-muted-foreground bg-white/5 border border-white/10">Total {stats.total}</button>
                    </div>

                    <div className="flex items-center gap-4 flex-1 max-w-sm">
                        <div className="relative w-full group">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-white transition-colors" />
                            <input
                                type="text"
                                placeholder="Search symbol..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-8 pr-4 py-1.5 bg-[#111] border border-white/5 rounded-sm focus:outline-none focus:border-white/20 transition-all text-xs text-white"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-0.5 bg-[#111] p-0.5 rounded-sm border border-white/5">
                        <button
                            onClick={() => setActiveFilter("ALL")}
                            className={`px-3 py-1 text-[10px] font-black uppercase rounded-sm transition-all ${activeFilter === "ALL" ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-muted-foreground hover:text-white'}`}
                        >All</button>
                        <button
                            onClick={() => setActiveFilter("GOLDEN")}
                            className={`px-3 py-1 text-[10px] font-black uppercase rounded-sm transition-all ${activeFilter === "GOLDEN" ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-muted-foreground hover:text-white'}`}
                        >Golden</button>
                        <button
                            onClick={() => setActiveFilter("UPTREND")}
                            className={`px-3 py-1 text-[10px] font-black uppercase rounded-sm transition-all ${activeFilter === "UPTREND" ? 'bg-blue-400 text-white shadow-lg shadow-blue-400/20' : 'text-muted-foreground hover:text-white'}`}
                        >Uptrend</button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center min-h-[400px]">
                        <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                        <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Syncing Intraday Data...</p>
                    </div>
                ) : stocks.length === 0 ? (
                    <div className="text-center py-20 bg-[#0a0a0a] border border-dashed border-white/5 rounded-sm">
                        <AlertCircle className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-1">No active signals found</h3>
                        <p className="text-[10px] text-muted-foreground uppercase font-medium">Waiting for fresh breakout commentary from the system.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-[1px] bg-white/5 border border-white/5">
                        {/* STRONG COLUMN */}
                        <div className="bg-[#050505] min-h-[calc(100vh-350px)]">
                            <div className="sticky top-0 z-10 bg-[#050505] p-3 border-b border-emerald-500/20 flex justify-between items-center">
                                <h2 className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.2em]">Strong</h2>
                                <span className="text-[13px] font-black text-emerald-500/50 font-mono">{categorized.strong.length}</span>
                            </div>
                            <div className="p-2 flex flex-col gap-[1px]">
                                <PremiumProtector requiredTier="pro" blurLevel="md" title="Premium" description="Upgrade to view live Strong stocks.">
                                    <AnimatePresence mode="popLayout">
                                        {categorized.strong.map(s => <StockCard key={s.symbol} stock={s} color="green" />)}
                                    </AnimatePresence>
                                </PremiumProtector>
                            </div>
                        </div>

                        {/* PULLBACK COLUMN */}
                        <div className="bg-[#050505] min-h-[calc(100vh-350px)] border-l border-white/5">
                            <div className="sticky top-0 z-10 bg-[#050505] p-3 border-b border-yellow-500/20 flex justify-between items-center">
                                <h2 className="text-[11px] font-black text-yellow-500 uppercase tracking-[0.2em]">Pullback Entry ▲</h2>
                                <span className="text-[13px] font-black text-yellow-500/50 font-mono">{categorized.pullback.length}</span>
                            </div>
                            <div className="p-2 flex flex-col gap-[1px]">
                                <PremiumProtector requiredTier="pro" blurLevel="md" title="Premium" description="Upgrade to view live Pullback entries.">
                                    <AnimatePresence mode="popLayout">
                                        {categorized.pullback.map(s => <StockCard key={s.symbol} stock={s} color="yellow" />)}
                                    </AnimatePresence>
                                </PremiumProtector>
                            </div>
                        </div>

                        {/* EXIT COLUMN */}
                        <div className="bg-[#050505] min-h-[calc(100vh-350px)] border-l border-white/5">
                            <div className="sticky top-0 z-10 bg-[#050505] p-3 border-b border-red-500/20 flex justify-between items-center">
                                <h2 className="text-[11px] font-black text-red-500 uppercase tracking-[0.2em]">Exit / Trap</h2>
                                <span className="text-[13px] font-black text-red-500/50 font-mono">{categorized.exit.length}</span>
                            </div>
                            <div className="p-2 flex flex-col gap-[1px]">
                                <PremiumProtector requiredTier="pro" blurLevel="md" title="Premium" description="Upgrade to view live Exits and Traps.">
                                    <AnimatePresence mode="popLayout">
                                        {categorized.exit.map(s => <StockCard key={s.symbol} stock={s} color="red" />)}
                                    </AnimatePresence>
                                </PremiumProtector>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default IntradayDev;
