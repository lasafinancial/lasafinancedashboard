import { useState, useMemo, useEffect, forwardRef } from "react";
import { Search, ArrowUpRight, Loader2, Sparkles, TrendingUp, ChevronDown, ChevronUp, Info, Clock, Calendar, AlertCircle, BarChart2, Filter, RefreshCw, Pin, ArrowRight, Play, Pause, SkipBack, SkipForward, FastForward, Rewind } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { useLiveData } from "@/hooks/useLiveData";
import { PremiumProtector } from "@/components/ui/PremiumProtector";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

type StateType = "STRONG" | "PULLBACK" | "EXIT";
type FilterType = "ALL" | "GOLDEN" | "UPTREND";

export function IntradayDev() {
    const navigate = useNavigate();
    const { intradayDev: stocks, intradayDevChanges, playbackSnapshots, lastUpdate, refresh, isLoading } = useLiveData();
    const { isFree } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState<FilterType>("ALL");
    const [pinnedSymbols, setPinnedSymbols] = useState<string[]>(() => {
        const saved = localStorage.getItem("lasa_intraday_pinned");
        return saved ? JSON.parse(saved) : [];
    });

    // Playback State
    const [isPlayback, setIsPlayback] = useState(false);
    const [playbackIndex, setPlaybackIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2 | 5>(5);

    // Auto-advance playback timer
    useEffect(() => {
        if (!isPlaying || !isPlayback || !playbackSnapshots || playbackSnapshots.length === 0) return;

        const interval = setInterval(() => {
            setPlaybackIndex(prev => {
                if (prev >= playbackSnapshots.length - 1) {
                    setIsPlaying(false); // Auto-pause at the end
                    return prev;
                }
                return prev + 1;
            });
        }, 5000 / playbackSpeed);

        return () => clearInterval(interval);
    }, [isPlaying, isPlayback, playbackSnapshots, playbackSpeed]);

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
        // Base arrays based on mode
        let sourceData = stocks || [];
        if (isPlayback && playbackSnapshots && playbackSnapshots.length > 0) {
            sourceData = playbackSnapshots[playbackIndex]?.stocks || [];
        }

        let data = sourceData.map(s => ({
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
    }, [stocks, searchTerm, activeFilter, pinnedSymbols, isPlayback, playbackSnapshots, playbackIndex]);

    const categorized = useMemo(() => {
        let currentChanges = intradayDevChanges || [];
        if (isPlayback && playbackSnapshots && playbackSnapshots.length > 0) {
            const index = Math.min(playbackIndex, playbackSnapshots.length - 1);
            currentChanges = playbackSnapshots[index]?.changes || [];
        }

        return {
            strong: filteredStocks.filter(s => s.state === "STRONG"),
            pullback: filteredStocks.filter(s => s.state === "PULLBACK"),
            exit: filteredStocks.filter(s => s.state === "EXIT"),
            changes: currentChanges
        };
    }, [filteredStocks, intradayDevChanges, isPlayback, playbackSnapshots, playbackIndex]);

    const stats = useMemo(() => ({
        strong: (stocks || []).filter(s => s.state === "STRONG").length,
        pullback: (stocks || []).filter(s => s.state === "PULLBACK").length,
        exit: (stocks || []).filter(s => s.state === "EXIT").length,
        changes: (intradayDevChanges || []).length,
        total: (stocks || []).length
    }), [stocks, intradayDevChanges]);

    type StockCardProps = { stock: any; color: 'green' | 'yellow' | 'red' };
    const StockCard = forwardRef<HTMLDivElement, StockCardProps>(({ stock, color }, ref) => {
        const isPullback = stock.state === "PULLBACK";
        const starRating = stock.tier === "GOLDEN" ? "★★★" : stock.tier === "UPTREND" ? "★★" : "★";

        return (
            <motion.div
                ref={ref}
                layout
                layoutId={stock.symbol}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group relative"
            >
                <div
                    onClick={() => handleStockClick(stock.symbol)}
                    className="p-3 bg-black hover:bg-[#0a0a0a] border-b border-white/5 cursor-pointer transition-all duration-200"
                >
                    <div className="flex justify-between items-start mb-1.5">
                        <div className="flex items-start gap-2">
                            {/* Left: Stars and Symbol */}
                            <div className="flex flex-col">
                                <div className={`text-[10px] font-black tracking-widest leading-none mb-1 ${stock.tier === 'GOLDEN' ? 'text-yellow-500' : 'text-blue-400'}`}>
                                    {starRating}
                                </div>
                                <h4 className="text-[13px] font-semibold tracking-[0.5px] text-white leading-none font-sans">{stock.symbol}</h4>
                            </div>
                        </div>

                        {/* Right: Pinned & Price */}
                        <div className="flex flex-col items-end gap-1">
                            <button
                                onClick={(e) => handleTogglePin(e, stock.symbol)}
                                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[9px] font-black tracking-wider transition-all border ${stock.isPinned
                                    ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30'
                                    : 'bg-transparent text-white/30 border-transparent hover:text-white/60'
                                    }`}
                            >
                                <Pin className={`w-3 h-3 ${stock.isPinned ? 'fill-current' : ''}`} />
                                {stock.isPinned ? 'PINNED' : ''}
                            </button>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[20px] font-semibold text-white font-mono tabular-nums tracking-tight">₹{formatNumber(stock.close)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        {/* EMA Line (New Feature) */}
                        <div className="text-[12px] font-medium text-muted-foreground/70 flex items-center gap-1.5 tracking-wider uppercase">
                            <span>EMA9 ₹{formatNumber(stock.ema9 || stock.close * 0.98)}</span>
                            <span className="opacity-40">|</span>
                            <span>EMA63 ₹{formatNumber(stock.ema63 || stock.close * 0.95)}</span>
                        </div>

                        {/* Event Note */}
                        {stock.event && (
                            <div className={`text-[10px] font-bold italic tracking-wide ${color === 'red' ? 'text-red-400' : color === 'yellow' ? 'text-yellow-500' : 'text-emerald-500'}`}>
                                {stock.event}
                            </div>
                        )}

                        {/* Pullback Trade Levels Table - Exact UI match */}
                        {isPullback && (
                            <div className="mt-2 mb-1 p-2 bg-[#0a0a0a] rounded-sm border border-white/5 relative">
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                                    <div className="flex justify-between items-center text-[10px] font-medium border-b border-white/5 pb-0.5">
                                        <span className="text-muted-foreground uppercase opacity-50 tracking-widest text-[8px]">ENTRY</span>
                                        <span className="text-yellow-500 font-bold tabular-nums">₹{formatNumber(stock.entry || stock.close)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-medium border-b border-white/5 pb-0.5">
                                        <span className="text-muted-foreground uppercase opacity-50 tracking-widest text-[8px]">TARGET</span>
                                        <span className="text-emerald-500 font-bold tabular-nums">₹{formatNumber(stock.target || stock.close * 1.05)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-medium pt-0.5 border-b border-white/5 pb-0.5 md:border-b-0 md:pb-0">
                                        <span className="text-muted-foreground uppercase opacity-50 tracking-widest text-[8px]">STOP</span>
                                        <span className="text-red-500 font-bold tabular-nums">₹{formatNumber(stock.stop || stock.close * 0.97)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-medium pt-0.5">
                                        <span className="text-muted-foreground uppercase opacity-50 tracking-widest text-[8px]">R:R</span>
                                        <span className="text-white font-bold tabular-nums">{stock.rr ? stock.rr.toFixed(1) : "1:1"}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* Status Note */}
                        {stock.note && !isPullback && (
                            <div className="text-[10px] text-muted-foreground/50 font-medium leading-relaxed bg-white/5 px-2 py-1 rounded-sm border border-white/5">
                                {stock.note}
                            </div>
                        )}

                        <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-white/30 uppercase tracking-widest">
                                <div className="w-1.5 h-1.5 rounded-sm bg-blue-500/50" />
                                {stock.allSignals || 1} SIGS <span className="text-white/20 mx-1">•</span> {stock.time}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    });

    type ChangeCardProps = { change: any };
    const ChangeCard = forwardRef<HTMLDivElement, ChangeCardProps>(({ change }, ref) => {
        const colorClass = change.toState === 'STRONG' ? 'text-emerald-400' :
            change.toState === 'PULLBACK' ? 'text-yellow-500' : 'text-red-500';

        return (
            <motion.div
                ref={ref}
                layout
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="px-4 py-2 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors cursor-pointer group flex flex-col justify-center min-h-[50px] bg-[#0a0a0a]"
                onClick={() => handleStockClick(change.symbol)}
            >
                <div className="flex flex-col gap-0.5">
                    <span className="text-[12px] font-medium text-muted-foreground/70 font-mono tracking-tighter">{change.time}</span>
                    <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-[#e8e8e8] tracking-[0.5px] uppercase w-20 truncate">{change.symbol}</span>
                        <span className="text-muted-foreground/30 text-[10px]">→</span>
                        <span className={`text-[11px] font-semibold uppercase tracking-[1px] ${colorClass}`}>
                            {change.toState === 'PULLBACK' ? '▲ ENTRY' : change.toState}
                        </span>
                    </div>
                </div>
                {change.note && (
                    <div className="text-[12px] font-medium text-muted-foreground/70 leading-relaxed mt-1 group-hover:text-muted-foreground/80 transition-colors">
                        {change.note}
                    </div>
                )}
            </motion.div>
        );
    });

    return (
        <div className="min-h-screen bg-[#050505] text-foreground selection:bg-primary/30 font-sans tracking-tight">
            <div className="container mx-auto px-4 py-4 max-w-[1400px]">

                {/* NEW PLAYBACK & HEADER BAR */}
                <div className="flex flex-col md:flex-row items-center justify-between bg-[#0a0a0a] border border-white/5 rounded-sm px-4 py-2 mb-4 gap-4">
                    {/* Left: Branding */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-baseline gap-2">
                            <h1 className="text-[13px] font-black tracking-widest text-[#e8e8e8] font-sans">BREAKOUT BOARD</h1>
                            <span className="text-[10px] font-bold tracking-widest text-emerald-500/70 bg-emerald-500/10 px-1.5 py-0.5 rounded-sm">EMA9 / EMA63 6-MIN</span>
                            <span className="text-[11px] font-bold text-yellow-500/70 tracking-widest">{new Date().toISOString().split('T')[0]}</span>
                        </div>
                    </div>

                    {/* Middle: Controls */}
                    <div className="flex items-center gap-4 flex-1 justify-center max-w-2xl bg-black/50 px-4 py-1.5 rounded-sm border border-white/5 shadow-inner">
                        {/* Clock */}
                        <div className="text-[30px] font-semibold text-yellow-500 font-mono tracking-tighter w-auto min-w-[100px] text-center leading-none">
                            {isPlayback && playbackSnapshots && playbackSnapshots[playbackIndex]
                                ? playbackSnapshots[playbackIndex].time
                                : (lastUpdate ? lastUpdate.split(' ')[0] : '...')}
                        </div>

                        <div className="w-[1px] h-6 bg-white/10 mx-2" />

                        {/* Basic Back/Forward Tools */}
                        <div className="flex items-center gap-1">
                            <button className="p-1 hover:bg-white/10 rounded-sm text-white/50 hover:text-white transition-colors">
                                <Rewind className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => {
                                    if (playbackSnapshots && playbackSnapshots.length > 0) {
                                        setIsPlayback(true);
                                        setPlaybackIndex(Math.max(0, playbackIndex - 1));
                                    }
                                }}
                                className="p-1 hover:bg-white/10 rounded-sm text-white/50 hover:text-white transition-colors">
                                <SkipBack className="w-3.5 h-3.5 fill-current" />
                            </button>
                            <button
                                onClick={() => {
                                    if (playbackSnapshots && playbackSnapshots.length > 0) {
                                        setPlaybackIndex(Math.min(playbackSnapshots.length - 1, playbackIndex + 1));
                                        if (playbackIndex >= playbackSnapshots.length - 2) setIsPlaying(false);
                                    }
                                }}
                                className="p-1 hover:bg-white/10 rounded-sm text-white/50 hover:text-white transition-colors">
                                <SkipForward className="w-3.5 h-3.5 fill-current" />
                            </button>
                            <button className="p-1 hover:bg-white/10 rounded-sm text-white/50 hover:text-white transition-colors">
                                <FastForward className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Play/Pause Button */}
                        <button
                            onClick={() => {
                                if (!isPlayback && playbackSnapshots && playbackSnapshots.length > 0) {
                                    setIsPlayback(true);
                                    setPlaybackIndex(0);
                                    setIsPlaying(true);
                                } else {
                                    setIsPlaying(!isPlaying);
                                }
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-sm text-[10px] font-black uppercase tracking-widest border transition-all ${isPlaying ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-white shadow-sm border-white/10 hover:bg-white/10'}`}
                        >
                            {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                            {isPlaying ? 'PAUSE' : 'PLAY'}
                        </button>

                        <div className="w-[1px] h-6 bg-white/10 mx-2" />

                        {/* Speed Toggle */}
                        <button
                            onClick={() => setPlaybackSpeed(s => s === 1 ? 2 : s === 2 ? 5 : 1)}
                            className="text-[10px] font-black text-white/50 hover:text-white w-6 text-center"
                        >
                            {playbackSpeed}x
                        </button>

                        {/* Scrubber Bar */}
                        <div className="flex-1 mx-4 max-w-[200px] flex items-center">
                            <input
                                type="range"
                                min={0}
                                max={playbackSnapshots ? Math.max(0, playbackSnapshots.length - 1) : 0}
                                value={playbackIndex}
                                onChange={(e) => {
                                    setIsPlayback(true);
                                    setIsPlaying(false);
                                    setPlaybackIndex(parseInt(e.target.value));
                                }}
                                className="w-full h-1 bg-white/10 rounded-full appearance-none py-2 cursor-pointer
                                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-yellow-500
                                    [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-yellow-500 [&::-moz-range-thumb]:border-0"
                                disabled={!playbackSnapshots || playbackSnapshots.length === 0}
                            />
                        </div>
                    </div>

                    {/* Right: Toggle Playback Mode */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-[9px] font-bold text-emerald-500/60 uppercase tracking-widest">
                            <div className={`w-1.5 h-1.5 rounded-full ${isPlayback ? 'bg-yellow-500' : 'bg-emerald-500 animate-pulse'}`} />
                            {isPlayback ? 'HISTORY MODE' : `Updated ${lastUpdate}`}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                if (!isPlayback) {
                                    setIsPlayback(true);
                                    setPlaybackIndex(playbackSnapshots ? Math.max(0, playbackSnapshots.length - 1) : 0);
                                } else {
                                    setIsPlayback(false);
                                    setIsPlaying(false);
                                }
                            }}
                            className={`h-7 text-[10px] font-black uppercase border transition-all ${isPlayback
                                ? 'bg-yellow-500 text-black border-yellow-600 hover:bg-yellow-400'
                                : 'bg-transparent border-yellow-500/30 text-yellow-500/70 hover:bg-yellow-500/10 hover:text-yellow-500'
                                }`}
                        >
                            PLAYBACK
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => refresh()}
                            className="h-7 text-[10px] font-black uppercase bg-blue-600/10 border-blue-600/30 text-blue-400 hover:bg-blue-600/20 px-2"
                        >
                            <RefreshCw className="w-3 h-3" />
                        </Button>
                    </div>
                </div>

                {/* NEW COMPACT STATS & TABS ROW */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4 px-2">
                    {/* Left: Stats */}
                    <div className="flex items-center gap-4 text-[11px] font-semibold uppercase tracking-[1px]">
                        <div className="flex items-center gap-1.5 text-emerald-500">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                            STRONG {stats.strong}
                        </div>
                        <div className="flex items-center gap-1.5 text-yellow-500">
                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)]" />
                            PULLBACK {stats.pullback}
                        </div>
                        <div className="flex items-center gap-1.5 text-red-500">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                            EXIT {stats.exit}
                        </div>
                        <div className="w-[1px] h-3 bg-white/10 mx-1" />
                        <div className="flex items-center gap-1.5 text-blue-400">
                            ★★★ GOLDEN {(stocks || []).filter(s => s.tier === 'GOLDEN').length}
                        </div>
                    </div>

                    {/* Right: Filter Tabs */}
                    <div className="flex items-center gap-1 bg-[#111] p-0.5 rounded-sm border border-white/5 shadow-inner">
                        <button
                            onClick={() => setActiveFilter("ALL")}
                            className={`px-3 py-1 text-[9px] font-black uppercase rounded-[2px] tracking-widest transition-all ${activeFilter === "ALL" ? 'bg-[#1b2c1b] text-emerald-500 border border-emerald-500/30 shadow-sm' : 'text-muted-foreground/60 border border-transparent hover:text-white/80 hover:bg-white/5'}`}
                        >
                            ALL
                        </button>
                        <button
                            onClick={() => setActiveFilter("GOLDEN")} // Treat as WATCHLIST for now
                            className={`px-3 py-1 text-[9px] font-black uppercase rounded-[2px] tracking-widest transition-all gap-1 flex items-center ${activeFilter === "GOLDEN" ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 shadow-sm' : 'text-muted-foreground/60 border border-transparent hover:text-white/80 hover:bg-white/5'}`}
                        >
                            <Sparkles className="w-2.5 h-2.5" /> WATCHLIST
                        </button>
                        <button
                            onClick={() => setActiveFilter("UPTREND")}
                            className={`px-3 py-1 text-[9px] font-black uppercase rounded-[2px] tracking-widest transition-all ${activeFilter === "UPTREND" ? 'bg-blue-400/10 text-blue-400 border border-blue-400/30 shadow-sm' : 'text-muted-foreground/60 border border-transparent hover:text-white/80 hover:bg-white/5'}`}
                        >
                            ★★★
                        </button>
                        <button className="px-3 py-1 text-[9px] font-black uppercase rounded-[2px] tracking-widest transition-all text-muted-foreground/60 border border-transparent hover:text-white/80 hover:bg-white/5">
                            ★★
                        </button>
                        <div className="w-[1px] h-3 bg-white/10 mx-1" />
                        <button className="px-3 py-1 text-[9px] font-black uppercase rounded-[2px] tracking-widest transition-all text-muted-foreground/60 border border-transparent hover:text-white/80 hover:bg-white/5">
                            ENTRY READY
                        </button>
                        <button className="px-3 py-1 text-[9px] font-black uppercase rounded-[2px] tracking-widest transition-all text-muted-foreground/60 border border-transparent hover:text-white/80 hover:bg-white/5">
                            EXIT
                        </button>
                    </div>
                </div>
                {
                    isLoading ? (
                        <div className="flex flex-col items-center justify-center min-h-[400px]" >
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[1px] bg-white/5 border border-white/5 overflow-hidden rounded-sm">
                            <LayoutGroup>
                                {/* STRONG COLUMN */}
                                <div className="bg-[#050505] min-h-[calc(100vh-350px)]">
                                    <div className="sticky top-0 z-10 bg-[#050505] p-3 border-b border-emerald-500/20 flex justify-between items-center">
                                        <h2 className="text-[11px] font-semibold text-emerald-500 uppercase tracking-[1px]">Strong</h2>
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
                                <div className="bg-[#050505] min-h-[calc(100vh-350px)]">
                                    <div className="sticky top-0 z-10 bg-[#050505] p-3 border-b border-yellow-500/20 flex justify-between items-center text-center">
                                        <h2 className="text-[11px] font-semibold text-yellow-500 uppercase tracking-[1px] flex-1">Pullback Entry ▲</h2>
                                        <span className="text-[13px] font-black text-yellow-500/50 font-mono absolute right-3">{categorized.pullback.length}</span>
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
                                <div className="bg-[#050505] min-h-[calc(100vh-350px)]">
                                    <div className="sticky top-0 z-10 bg-[#050505] p-3 border-b border-red-500/20 flex justify-between items-center text-center">
                                        <h2 className="text-[11px] font-semibold text-red-500 uppercase tracking-[1px] flex-1">Exit / Trap</h2>
                                        <span className="text-[13px] font-black text-red-500/50 font-mono absolute right-3">{categorized.exit.length}</span>
                                    </div>
                                    <div className="p-2 flex flex-col gap-[1px]">
                                        <PremiumProtector requiredTier="pro" blurLevel="md" title="Premium" description="Upgrade to view live Exits and Traps.">
                                            <AnimatePresence mode="popLayout">
                                                {categorized.exit.map(s => <StockCard key={s.symbol} stock={s} color="red" />)}
                                            </AnimatePresence>
                                        </PremiumProtector>
                                    </div>
                                </div>

                                <div className="bg-[#050505] min-h-[calc(100vh-350px)]">
                                    <div className="sticky top-0 z-10 bg-[#050505] p-3 border-b border-blue-500/10 flex justify-between items-center text-center">
                                        <div className="flex items-center gap-2">
                                            <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[6px] border-l-blue-400/40 border-b-[4px] border-b-transparent ml-1" />
                                            <h2 className="text-[11px] font-black text-blue-400/60 uppercase tracking-[0.2em] font-mono">Changes</h2>
                                        </div>
                                        <span className="text-[12px] font-black text-blue-500/30 font-mono absolute right-3">{categorized.changes.length}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <AnimatePresence mode="popLayout">
                                            {(categorized.changes || [])
                                                .map((c, i) => <ChangeCard key={`${c.symbol}-${c.time}-${i}`} change={c} />)
                                            }
                                            {(categorized.changes || []).length === 0 && (
                                                <div className="py-20 text-center px-4">
                                                    <div className="text-[9px] font-black text-white/5 uppercase tracking-[0.3em] mb-1">Live Feed</div>
                                                    <div className="text-[8px] font-medium text-white/5 lowercase">Waiting for movements...</div>
                                                </div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </LayoutGroup>
                        </div>
                    )
                }
            </div >
        </div >
    );
}

export default IntradayDev;
