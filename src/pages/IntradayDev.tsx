import { useState, useMemo, useEffect, forwardRef } from "react";
import { Search, ArrowUpRight, Loader2, Sparkles, TrendingUp, ChevronDown, ChevronUp, Info, Clock, Calendar, AlertCircle, BarChart2, Filter, RefreshCw, Pin, ArrowRight, Play, Pause, SkipBack, SkipForward, FastForward, Rewind, Star } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { useLiveData } from "@/hooks/useLiveData";
import { PremiumProtector } from "@/components/ui/PremiumProtector";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

type StateType = "STRONG" | "PULLBACK" | "EXIT";
type FilterType = "ALL" | "WATCHLIST" | "STAR3" | "STAR2" | "ENTRY_READY" | "EXIT";

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

    // Mobile Accordion State
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        strong: true,
        pullback: true,
        exit: true,
        changes: false
    });

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

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

        if (activeFilter === "WATCHLIST") {
            data = data.filter(s => s.isPinned);
        } else if (activeFilter === "STAR3") {
            data = data.filter(s => s.tier === "GOLDEN" || s.stars === "★★★");
        } else if (activeFilter === "STAR2") {
            data = data.filter(s => s.tier === "UPTREND" || s.stars === "★★");
        } else if (activeFilter === "ENTRY_READY") {
            data = data.filter(s => s.state === "PULLBACK");
        } else if (activeFilter === "EXIT") {
            data = data.filter(s => s.state === "EXIT" || s.state === "TRAP");
        }

        // Sort: Pinned > Golden > Uptrend > Time
        return data.sort((a, b) => {
            // Priority 1: Pinned (Always on top)
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;

            // Priority 2: Golden Tier
            if (a.tier === "GOLDEN" && b.tier !== "GOLDEN") return -1;
            if (a.tier !== "GOLDEN" && b.tier === "GOLDEN") return 1;

            // Priority 3: Uptrend Tier
            if (a.tier === "UPTREND" && b.tier !== "UPTREND") return -1;
            if (a.tier !== "UPTREND" && b.tier === "UPTREND") return 1;

            // Priority 4: Time (latest first)
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
            exit: filteredStocks.filter(s => s.state === "EXIT" || s.state === "TRAP"),
            changes: currentChanges
        };
    }, [filteredStocks, intradayDevChanges, isPlayback, playbackSnapshots, playbackIndex]);

    const stats = useMemo(() => ({
        strong: (stocks || []).filter(s => s.state === "STRONG").length,
        pullback: (stocks || []).filter(s => s.state === "PULLBACK").length,
        exit: (stocks || []).filter(s => s.state === "EXIT" || s.state === "TRAP").length,
        changes: (intradayDevChanges || []).length,
        total: (stocks || []).length
    }), [stocks, intradayDevChanges]);

    type StockCardProps = { stock: any; color: 'green' | 'yellow' | 'red' };
    const StockCard = forwardRef<HTMLDivElement, StockCardProps>(({ stock, color }, ref) => {
        const isPullback = stock.state === "PULLBACK";

        const renderStars = (stars: string) => {
            if (!stars) return null;
            const count = (stars.match(/★/g) || []).length || parseInt(stars) || 0;
            if (count === 0) return null;
            return (
                <div className="flex gap-0.5 text-green-500 mr-2">
                    {Array.from({ length: Math.min(count, 5) }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-current" />
                    ))}
                </div>
            );
        };

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
                    className="p-3 bg-black border border-white/5 rounded-lg mb-2 cursor-pointer transition-all duration-200 hover:border-white/20 group relative overflow-hidden"
                >
                    {/* Header Row: Stars + Name + Tier Overlay */}
                    <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center">
                            {renderStars(stock.stars)}
                            <h4 className="text-[15px] font-bold tracking-wider text-white font-sans uppercase">
                                {stock.symbol}
                            </h4>
                        </div>
                        {stock.tier && (
                            <div className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest border ${stock.tier === 'GOLDEN'
                                ? 'bg-yellow-500/5 text-yellow-500/80 border-yellow-500/20'
                                : 'bg-green-500/5 text-green-500/80 border-green-500/20'
                                } uppercase`}>
                                {stock.stars && stock.stars.includes('★') ? stock.stars : (stock.tier === 'GOLDEN' ? '★★★' : '★★')} {stock.tier}
                            </div>
                        )}
                    </div>

                    {/* Price & Change Row */}
                    <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-[13px] font-bold text-white font-mono tabular-nums">
                            ₹{formatNumber(stock.close)}
                        </span>
                        <span className={`text-[11px] font-bold ${stock.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {stock.changePercent >= 0 ? '+' : ''}{formatNumber(stock.changePercent)}%
                        </span>
                    </div>

                    {/* EMA Row */}
                    <div className="flex items-center gap-3 text-[11px] font-medium tracking-tight mb-1.5 opacity-80">
                        <div className="flex items-center gap-1">
                            <span className="text-white/80 uppercase">EMA9:</span>
                            <span className="text-cyan-400 font-bold font-mono">₹{formatNumber(stock.ema9)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-white/80 uppercase">EMA63:</span>
                            <span className="text-cyan-400 font-bold font-mono">₹{formatNumber(stock.ema63)}</span>
                        </div>
                        {stock.emaCrossover && (
                            <div className={`flex items-center gap-0.5 font-bold text-[10px] ${color === 'red' ? 'text-red-500' : 'text-emerald-400'}`}>
                                <ArrowUpRight className="w-3 h-3" />
                                <span className="uppercase tracking-tighter">
                                    {stock.emaCrossover === 'Y' || stock.emaCrossover === 'YES' ? 'EMA9>63' : stock.emaCrossover}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Target Row */}
                    {stock.targetStr && (
                        <div className="flex items-center gap-1.5 text-[13px] font-bold text-orange-400/90 mb-2">
                            <ArrowRight className="w-3.5 h-3.5" />
                            <span>{stock.targetStr}</span>
                        </div>
                    )}

                    {/* Reasons Block */}
                    {stock.reasons && (
                        <div className={`${color === 'red' ? 'bg-red-950/20 border-red-500/40' : 'bg-green-950/20 border-green-500/40'} border-l-2 py-1.5 px-3 -mx-3 mb-2`}>
                            <p className={`text-[11px] font-medium leading-relaxed italic ${color === 'red' ? 'text-red-400' : 'text-green-400'}`}>
                                {stock.reasons}
                            </p>
                        </div>
                    )}

                    {/* Bottom Row */}
                    <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2 text-white/50 text-[10px] font-bold">
                            <Clock className="w-3 h-3 opacity-50" />
                            <span>{stock.time}</span>
                        </div>

                        <button
                            onClick={(e) => handleTogglePin(e, stock.symbol)}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-[9px] font-black tracking-widest transition-all ${stock.isPinned
                                ? 'bg-yellow-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.2)]'
                                : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                                }`}
                        >
                            <Pin className={`w-2.5 h-2.5 ${stock.isPinned ? 'fill-current' : ''}`} />
                            {stock.isPinned ? 'PINNED' : 'PIN'}
                        </button>
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
        <div className="min-h-screen bg-[#050505] text-foreground selection:bg-primary/30 font-sans tracking-tight overflow-x-hidden">
            <div className="container mx-auto px-4 py-4 max-w-[1400px]">

                {/* NEW PLAYBACK & HEADER BAR */}
                <div className="flex flex-col md:flex-row items-center justify-between bg-[#0a0a0a] border border-white/5 rounded-sm px-4 py-2 mb-4 gap-4">
                    {/* Left: Branding */}
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full sm:w-auto">
                            <h1 className="text-[13px] font-black tracking-widest text-[#e8e8e8] font-sans">BREAKOUT BOARD</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] sm:text-[10px] font-bold tracking-widest text-emerald-500/70 bg-emerald-500/10 px-1.5 py-0.5 rounded-sm whitespace-nowrap">EMA9 / EMA63 6-MIN</span>
                                <span className="text-[10px] sm:text-[11px] font-bold text-yellow-500/70 tracking-widest whitespace-nowrap">{new Date().toISOString().split('T')[0]}</span>
                            </div>
                        </div>
                    </div>

                    {/* Middle: Controls */}
                    <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-center w-full max-w-2xl bg-black/50 px-2 sm:px-4 py-1.5 rounded-sm border border-white/5 shadow-inner">
                        {/* Clock */}
                        <div className="text-[24px] sm:text-[30px] font-semibold text-yellow-500 font-mono tracking-tighter w-auto min-w-[80px] sm:min-w-[100px] text-center leading-none">
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

                        <div className="hidden xs:flex items-center gap-2">
                            <div className="w-[1px] h-6 bg-white/10 mx-1 sm:mx-2" />
                            {/* Speed Toggle */}
                            <button
                                onClick={() => setPlaybackSpeed(s => s === 1 ? 2 : s === 2 ? 5 : 1)}
                                className="text-[10px] font-black text-white/50 hover:text-white w-6 text-center"
                            >
                                {playbackSpeed}x
                            </button>
                        </div>

                        {/* Scrubber Bar - Hidden on small mobile to prevent overlap */}
                        <div className="hidden sm:flex flex-1 mx-4 max-w-[200px] items-center">
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
                    {/* Left: Stats - Grid on mobile for alignment */}
                    <div className="grid grid-cols-2 md:flex md:items-center gap-x-8 gap-y-3 md:gap-4 text-[11px] font-semibold uppercase tracking-[1px] w-full md:w-auto">
                        <div className="flex items-center gap-1.5 text-emerald-500">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                            <div className="flex flex-col md:flex-row md:gap-1">
                                <span>STRONG</span>
                                <span className="font-black text-[12px] opacity-80">{stats.strong}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-yellow-500">
                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)]" />
                            <div className="flex flex-col md:flex-row md:gap-1">
                                <span>PULLBACK</span>
                                <span className="font-black text-[12px] opacity-80">{stats.pullback}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-red-500">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                            <div className="flex flex-col md:flex-row md:gap-1">
                                <span>EXIT</span>
                                <span className="font-black text-[12px] opacity-80">{stats.exit}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-yellow-500">
                            <div className="flex flex-col md:flex-row md:gap-1">
                                <span className="whitespace-nowrap">★★★ GOLDEN</span>
                                <span className="font-black text-[12px] opacity-80">{(stocks || []).filter(s => s.tier === 'GOLDEN').length}</span>
                            </div>
                        </div>
                    </div>

                    {/* Search Bar - Responsive */}
                    <div className="relative w-full md:max-w-[220px] group mx-0 md:mx-2 my-2 md:my-0 order-last md:order-none">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none transition-colors group-focus-within:text-emerald-500">
                            <Search className="h-3.5 w-3.5 text-white/30 group-focus-within:text-emerald-500/70" />
                        </div>
                        <input
                            type="text"
                            placeholder="SEARCH STOCKS..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-9 bg-[#0f0f0f] border border-white/20 rounded-sm pl-9 pr-3 text-[10px] font-bold tracking-widest text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50 focus:bg-[#111] transition-all outline-none shadow-sm"
                        />
                    </div>

                    {/* Right: Filter Tabs - Horizontal Scroll on small mobile */}
                    <div className="w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                        <div className="flex items-center gap-1 bg-[#111] p-0.5 rounded-sm border border-white/5 shadow-inner min-w-max md:min-w-0">
                            <button
                                onClick={() => setActiveFilter("ALL")}
                                className={`px-3 py-1 text-[9px] font-black uppercase rounded-[2px] tracking-widest transition-all ${activeFilter === "ALL" ? 'bg-[#1b2c1b] text-emerald-500 border border-emerald-500/30 shadow-sm' : 'text-muted-foreground/60 border border-transparent hover:text-white/80 hover:bg-white/5'}`}
                            >
                                ALL
                            </button>
                            <button
                                onClick={() => setActiveFilter("WATCHLIST")}
                                className={`px-3 py-1 text-[9px] font-black uppercase rounded-[2px] tracking-widest transition-all gap-1 flex items-center ${activeFilter === "WATCHLIST" ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 shadow-sm' : 'text-muted-foreground/60 border border-transparent hover:text-white/80 hover:bg-white/5'}`}
                            >
                                <Sparkles className="w-2.5 h-2.5" /> WATCHLIST
                            </button>
                            <button
                                onClick={() => setActiveFilter("STAR3")}
                                className={`px-3 py-1 text-[9px] font-black uppercase rounded-[2px] tracking-widest transition-all ${activeFilter === "STAR3" ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 shadow-sm' : 'text-muted-foreground/60 border border-transparent hover:text-white/80 hover:bg-white/5'}`}
                            >
                                ★★★
                            </button>
                            <button
                                onClick={() => setActiveFilter("STAR2")}
                                className={`px-3 py-1 text-[9px] font-black uppercase rounded-[2px] tracking-widest transition-all ${activeFilter === "STAR2" ? 'bg-blue-400/10 text-blue-400 border border-blue-400/30 shadow-sm' : 'text-muted-foreground/60 border border-transparent hover:text-white/80 hover:bg-white/5'}`}
                            >
                                ★★
                            </button>
                            <div className="w-[1px] h-3 bg-white/10 mx-1" />
                            <button
                                onClick={() => setActiveFilter("ENTRY_READY")}
                                className={`px-3 py-1 text-[9px] font-black uppercase rounded-[2px] tracking-widest transition-all ${activeFilter === "ENTRY_READY" ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 shadow-sm' : 'text-muted-foreground/60 border border-transparent hover:text-white/80 hover:bg-white/5'}`}
                            >
                                ENTRY READY
                            </button>
                            <button
                                onClick={() => setActiveFilter("EXIT")}
                                className={`px-3 py-1 text-[9px] font-black uppercase rounded-[2px] tracking-widest transition-all ${activeFilter === "EXIT" ? 'bg-red-500/10 text-red-500 border border-red-500/30 shadow-sm' : 'text-muted-foreground/60 border border-transparent hover:text-white/80 hover:bg-white/5'}`}
                            >
                                EXIT
                            </button>
                        </div>
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
                        <div className="flex flex-col md:grid md:grid-cols-2 lg:grid-cols-4 gap-[2px] bg-white/5 border border-white/5 overflow-hidden rounded-sm">
                            <LayoutGroup>
                                {/* STRONG COLUMN */}
                                <div className="bg-[#050505] md:min-h-[calc(100vh-350px)]">
                                    <div
                                        onClick={() => toggleSection('strong')}
                                        className="sticky top-0 z-10 bg-[#050505] p-3 border-b border-emerald-500/20 flex justify-between items-center cursor-pointer md:cursor-default"
                                    >
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-[11px] font-semibold text-emerald-500 uppercase tracking-[1px]">Strong</h2>
                                            <div className="md:hidden">
                                                {expandedSections.strong ? <ChevronUp className="w-3 h-3 text-emerald-500/50" /> : <ChevronDown className="w-3 h-3 text-emerald-500/50" />}
                                            </div>
                                        </div>
                                        <span className="text-[13px] font-black text-emerald-500/50 font-mono">{categorized.strong.length}</span>
                                    </div>
                                    <AnimatePresence>
                                        {expandedSections.strong && (
                                            <div className="p-2 flex flex-col gap-[1px] md:hidden">
                                                <PremiumProtector requiredTier="pro" blurLevel="md" title="Premium" description="Upgrade to view live Strong stocks.">
                                                    <div className="flex flex-col gap-[1px]">
                                                        {categorized.strong.map(s => <StockCard key={s.symbol} stock={s} color="green" />)}
                                                    </div>
                                                </PremiumProtector>
                                            </div>
                                        )}
                                    </AnimatePresence>
                                    <div className="hidden md:flex p-2 flex-col gap-[1px]">
                                        <PremiumProtector requiredTier="pro" blurLevel="md" title="Premium" description="Upgrade to view live Strong stocks.">
                                            <AnimatePresence mode="popLayout">
                                                {categorized.strong.map(s => <StockCard key={s.symbol} stock={s} color="green" />)}
                                            </AnimatePresence>
                                        </PremiumProtector>
                                    </div>
                                </div>

                                {/* PULLBACK COLUMN */}
                                <div className="bg-[#050505] md:min-h-[calc(100vh-350px)]">
                                    <div
                                        onClick={() => toggleSection('pullback')}
                                        className="sticky top-0 z-10 bg-[#050505] p-3 border-b border-yellow-500/20 flex justify-between items-center cursor-pointer md:cursor-default"
                                    >
                                        <div className="flex items-center gap-2 flex-1 justify-center md:justify-start">
                                            <h2 className="text-[11px] font-semibold text-yellow-500 uppercase tracking-[1px] ml-6 md:ml-0">Pullback Entry ▲</h2>
                                            <div className="md:hidden">
                                                {expandedSections.pullback ? <ChevronUp className="w-3 h-3 text-yellow-500/50" /> : <ChevronDown className="w-3 h-3 text-yellow-500/50" />}
                                            </div>
                                        </div>
                                        <span className="text-[13px] font-black text-yellow-500/50 font-mono absolute right-3">{categorized.pullback.length}</span>
                                    </div>
                                    <AnimatePresence>
                                        {expandedSections.pullback && (
                                            <div className="p-2 flex flex-col gap-[1px] md:hidden">
                                                <PremiumProtector requiredTier="pro" blurLevel="md" title="Premium" description="Upgrade to view live Pullback entries.">
                                                    <div className="flex flex-col gap-[1px]">
                                                        {categorized.pullback.map(s => <StockCard key={s.symbol} stock={s} color="yellow" />)}
                                                    </div>
                                                </PremiumProtector>
                                            </div>
                                        )}
                                    </AnimatePresence>
                                    <div className="hidden md:flex p-2 flex-col gap-[1px]">
                                        <PremiumProtector requiredTier="pro" blurLevel="md" title="Premium" description="Upgrade to view live Pullback entries.">
                                            <AnimatePresence mode="popLayout">
                                                {categorized.pullback.map(s => <StockCard key={s.symbol} stock={s} color="yellow" />)}
                                            </AnimatePresence>
                                        </PremiumProtector>
                                    </div>
                                </div>

                                {/* EXIT COLUMN */}
                                <div className="bg-[#050505] md:min-h-[calc(100vh-350px)]">
                                    <div
                                        onClick={() => toggleSection('exit')}
                                        className="sticky top-0 z-10 bg-[#050505] p-3 border-b border-red-500/20 flex justify-between items-center cursor-pointer md:cursor-default"
                                    >
                                        <div className="flex items-center gap-2 flex-1 justify-center md:justify-start">
                                            <h2 className="text-[11px] font-semibold text-red-500 uppercase tracking-[1px] ml-6 md:ml-0">Exit / Trap</h2>
                                            <div className="md:hidden">
                                                {expandedSections.exit ? <ChevronUp className="w-3 h-3 text-red-500/50" /> : <ChevronDown className="w-3 h-3 text-red-500/50" />}
                                            </div>
                                        </div>
                                        <span className="text-[13px] font-black text-red-500/50 font-mono absolute right-3">{categorized.exit.length}</span>
                                    </div>
                                    <AnimatePresence>
                                        {expandedSections.exit && (
                                            <div className="p-2 flex flex-col gap-[1px] md:hidden">
                                                <PremiumProtector requiredTier="pro" blurLevel="md" title="Premium" description="Upgrade to view live Exits and Traps.">
                                                    <div className="flex flex-col gap-[1px]">
                                                        {categorized.exit.map(s => <StockCard key={s.symbol} stock={s} color="red" />)}
                                                    </div>
                                                </PremiumProtector>
                                            </div>
                                        )}
                                    </AnimatePresence>
                                    <div className="hidden md:flex p-2 flex-col gap-[1px]">
                                        <PremiumProtector requiredTier="pro" blurLevel="md" title="Premium" description="Upgrade to view live Exits and Traps.">
                                            <AnimatePresence mode="popLayout">
                                                {categorized.exit.map(s => <StockCard key={s.symbol} stock={s} color="red" />)}
                                            </AnimatePresence>
                                        </PremiumProtector>
                                    </div>
                                </div>

                                {/* CHANGES COLUMN */}
                                <div className="bg-[#050505] md:min-h-[calc(100vh-350px)] border-t md:border-t-0 border-white/5">
                                    <div
                                        onClick={() => toggleSection('changes')}
                                        className="sticky top-0 z-10 bg-[#050505] p-3 border-b border-blue-500/10 flex justify-between items-center cursor-pointer md:cursor-default"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[6px] border-l-blue-400/40 border-b-[4px] border-b-transparent ml-1" />
                                            <h2 className="text-[11px] font-black text-blue-400/60 uppercase tracking-[0.2em] font-mono">Changes</h2>
                                            <div className="md:hidden">
                                                {expandedSections.changes ? <ChevronUp className="w-3 h-3 text-blue-500/50" /> : <ChevronDown className="w-3 h-3 text-blue-500/50" />}
                                            </div>
                                        </div>
                                        <span className="text-[12px] font-black text-blue-500/30 font-mono absolute right-3">{categorized.changes.length}</span>
                                    </div>
                                    <AnimatePresence>
                                        {expandedSections.changes && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="flex flex-col overflow-hidden md:hidden"
                                            >
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
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    <div className="hidden md:flex flex-col">
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
