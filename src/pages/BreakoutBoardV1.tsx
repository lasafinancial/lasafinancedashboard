import { useState, useMemo, useEffect } from "react";
import { Search, ArrowUpRight, Loader2, Sparkles, TrendingUp, ChevronDown, ChevronUp, Info, Clock, Calendar, AlertCircle, BarChart2, Filter, RefreshCw, Pin, Play, Pause, SkipBack, SkipForward, FastForward, Rewind, Star } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useLiveData } from "@/hooks/useLiveData";
import { PremiumProtector } from "@/components/ui/PremiumProtector";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type FilterType = "ALL" | "WATCHLIST" | "STAR3" | "STAR2" | "ENTRY_READY" | "EXIT";

export function BreakoutBoardV1() {
    const navigate = useNavigate();
    const { intradayDev: stocks, goldenAlerts, playbackSnapshots, lastUpdate, refresh, isLoading } = useLiveData();
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

    useEffect(() => {
        if (!isPlaying || !isPlayback || !playbackSnapshots || playbackSnapshots.length === 0) return;

        const interval = setInterval(() => {
            setPlaybackIndex(prev => {
                if (prev >= playbackSnapshots.length - 1) {
                    setIsPlaying(false);
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

    const handleTogglePin = (symbol: string) => {
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
            data = data.filter(s => s.tier === "GOLDEN" || (s.stars && s.stars.includes('★★★')));
        } else if (activeFilter === "STAR2") {
            data = data.filter(s => s.tier === "UPTREND" || s.tier === "BREAKOUT" || (s.stars && s.stars.includes('★★')));
        } else if (activeFilter === "ENTRY_READY") {
            data = data.filter(s => s.state === "PULLBACK");
        } else if (activeFilter === "EXIT") {
            data = data.filter(s => s.state === "EXIT" || s.state === "TRAP");
        }

        return data.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            if (a.tier === "GOLDEN" && b.tier !== "GOLDEN") return -1;
            if (a.tier !== "GOLDEN" && b.tier === "GOLDEN") return 1;

            const valA = parseFloat(a.valV);
            const valB = parseFloat(b.valV);
            const isAValid = !isNaN(valA);
            const isBValid = !isNaN(valB);

            if (isAValid && !isBValid) return -1;
            if (!isAValid && isBValid) return 1;
            if (isAValid && isBValid && valA !== valB) return valB - valA;

            return b.time.localeCompare(a.time);
        });
    }, [stocks, searchTerm, activeFilter, pinnedSymbols, isPlayback, playbackSnapshots, playbackIndex]);

    const renderStars = (stars: string) => {
        if (!stars) return null;
        const count = (stars.match(/★/g) || []).length || parseInt(stars) || 0;
        if (count === 0) return null;
        return (
            <div className="flex gap-0.5 text-yellow-500">
                {Array.from({ length: Math.min(count, 5) }).map((_, i) => (
                    <Star key={i} className="w-2.5 h-2.5 fill-current" />
                ))}
            </div>
        );
    };

    const getStrengthBadge = (state: string) => {
        switch (state) {
            case "STRONG":
                return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20 px-1 text-[10px] font-black">STRONG</Badge>;
            case "PULLBACK":
                return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20 px-1 text-[10px] font-black">PULLBACK</Badge>;
            case "EXIT":
            case "TRAP":
                return <Badge className="bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20 px-1 text-[10px] font-black">EXIT</Badge>;
            default:
                return <Badge className="bg-white/5 text-white/50 border-white/10 px-1 text-[10px] font-black">{state}</Badge>;
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] text-foreground selection:bg-primary/30">
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
            </div>

            <div className="relative container mx-auto px-2 py-4 max-w-[1600px]">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-center justify-between bg-white/[0.02] border border-white/10 rounded-xl px-4 py-1.5 mb-4 gap-4 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/20 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">Breakout Board <span className="gradient-text italic">v1</span></h1>
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Excel Optimized Terminal View</p>
                        </div>
                    </div>

                    {/* Playback Controls */}
                    <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 shadow-inner">
                        <div className="text-xl font-bold text-yellow-500 font-mono tracking-tighter min-w-[80px] text-center">
                            {isPlayback && playbackSnapshots && playbackSnapshots[playbackIndex]
                                ? playbackSnapshots[playbackIndex].time
                                : (lastUpdate ? lastUpdate.split(' ')[0] : '--:--')}
                        </div>
                        <div className="w-[1px] h-6 bg-white/10 mx-2" />
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-white/50 hover:text-white" onClick={() => {
                                if (playbackSnapshots?.length) {
                                    setIsPlayback(true);
                                    setPlaybackIndex(Math.max(0, playbackIndex - 1));
                                }
                            }}>
                                <SkipBack className="w-3.5 h-3.5 fill-current" />
                            </Button>
                            <Button variant="ghost" size="icon" className={`h-8 w-16 text-[10px] font-black uppercase tracking-widest border transition-all ${isPlaying ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-white border-white/10'}`} onClick={() => {
                                if (!isPlayback && playbackSnapshots?.length) {
                                    setIsPlayback(true);
                                    setPlaybackIndex(0);
                                    setIsPlaying(true);
                                } else {
                                    setIsPlaying(!isPlaying);
                                }
                            }}>
                                {isPlaying ? <Pause className="w-3 h-3 fill-current mr-1" /> : <Play className="w-3 h-3 fill-current mr-1" />}
                                {isPlaying ? 'PAUSE' : 'PLAY'}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-white/50 hover:text-white" onClick={() => {
                                if (playbackSnapshots?.length) {
                                    setPlaybackIndex(Math.min(playbackSnapshots.length - 1, playbackIndex + 1));
                                    if (playbackIndex >= playbackSnapshots.length - 2) setIsPlaying(false);
                                }
                            }}>
                                <SkipForward className="w-3.5 h-3.5 fill-current" />
                            </Button>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setIsPlayback(!isPlayback)} className={`h-7 text-[10px] font-black uppercase border ${isPlayback ? 'bg-yellow-500 text-black border-yellow-600' : 'bg-transparent border-primary/30 text-primary'}`}>
                            {isPlayback ? 'HISTORY' : 'LIVE'}
                        </Button>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Search symbol..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-48 pl-10 pr-4 py-1.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all text-xs"
                            />
                        </div>
                        <Button variant="outline" size="sm" onClick={() => refresh()} className="h-8 w-8 p-0 border-white/10 hover:bg-white/5">
                            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>

                {/* Main Table Content */}
                <div className="bg-white/[0.01] border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm shadow-2xl">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-white/[0.03]">
                                <TableRow className="border-white/5 hover:bg-transparent">
                                    <TableHead className="w-[100px] text-[11px] font-black text-white/60 uppercase tracking-widest text-center">Strength</TableHead>
                                    <TableHead className="w-[150px] text-[11px] font-black text-white/60 uppercase tracking-widest">Symbol</TableHead>
                                    <TableHead className="text-[11px] font-black text-white/60 uppercase tracking-widest text-right">Price</TableHead>
                                    <TableHead className="text-[11px] font-black text-white/60 uppercase tracking-widest text-right">Resistance</TableHead>
                                    <TableHead className="text-[11px] font-black text-white/60 uppercase tracking-widest text-right">Model</TableHead>
                                    <TableHead className="text-[11px] font-black text-white/60 uppercase tracking-widest pl-10">Projection / Note</TableHead>
                                    <TableHead className="text-[11px] font-black text-white/60 uppercase tracking-widest text-center">BO Today</TableHead>
                                    <TableHead className="text-[11px] font-black text-white/60 uppercase tracking-widest text-center">Tier</TableHead>
                                    <TableHead className="w-[60px] text-[11px] font-black text-white/60 uppercase tracking-widest text-center">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="h-64 text-center">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                                                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Initializing Terminal Data...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredStocks.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="h-64 text-center">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <AlertCircle className="h-8 w-8 text-muted-foreground/30" />
                                                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">No active signals found</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    <PremiumProtector requiredTier="pro" blurLevel="md">
                                        {(isFree ? filteredStocks.slice(0, 8) : filteredStocks).map((stock, idx) => (
                                            <TableRow key={`${stock.symbol}-${idx}`} className="border-white/5 hover:bg-white/[0.04] transition-colors group">
                                                <TableCell className="py-1 text-center">
                                                    {getStrengthBadge(stock.state)}
                                                </TableCell>
                                                <TableCell className="py-1">
                                                    <div className="flex flex-col leading-tight">
                                                        <span className="text-sm font-black text-white tracking-tight group-hover:text-primary transition-colors">{stock.symbol}</span>
                                                        <span className="text-[8px] text-muted-foreground font-bold font-mono">{stock.time}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-1 text-right font-black font-mono text-sm">
                                                    ₹{formatNumber(stock.close)}
                                                </TableCell>
                                                <TableCell className="py-1 text-right font-bold font-mono text-xs text-red-400/80">
                                                    ₹{formatNumber(stock.resistance)}
                                                </TableCell>
                                                <TableCell className="py-1 text-right font-bold font-mono text-xs text-orange-400/80">
                                                    ₹{formatNumber(stock.MODEL || stock.targetPrice || stock.target)}
                                                </TableCell>
                                                <TableCell className="py-1 max-w-[300px] pl-10">
                                                    <div className="flex flex-col gap-0 leading-tight">
                                                        <span className="text-[10px] font-bold text-white/80 italic line-clamp-1">{stock.reasons || stock.note || 'No commentary available.'}</span>
                                                        {stock.targetStr && <span className="text-[9px] font-black text-orange-500/70 tracking-widest uppercase">{stock.targetStr}</span>}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-1 text-center">
                                                    <span className={`text-[10px] font-black px-1.5 py-0 rounded ${stock.valV ? 'bg-primary/10 text-primary border border-primary/20' : 'text-white/20'}`}>
                                                        {stock.valV || '—'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-1 text-center">
                                                    <div className="flex flex-col items-center gap-0">
                                                        {renderStars(stock.stars)}
                                                        <span className={`text-[8px] font-black tracking-tighter uppercase ${stock.tier === 'GOLDEN' ? 'text-yellow-500' : 'text-white/40'}`}>
                                                            {stock.tier}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-1 text-center">
                                                    <div className="flex items-center justify-center gap-0.5">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className={`h-7 w-7 ${stock.isPinned ? 'text-yellow-500' : 'text-white/20 hover:text-white'}`}
                                                            onClick={() => handleTogglePin(stock.symbol)}
                                                        >
                                                            <Pin className={`w-3.5 h-3.5 ${stock.isPinned ? 'fill-current' : ''}`} />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-primary/40 hover:text-primary hover:bg-primary/10"
                                                            onClick={() => handleStockClick(stock.symbol)}
                                                        >
                                                            <BarChart2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </PremiumProtector>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Bottom Stats Footer */}
                <div className="mt-4 flex flex-wrap gap-4 px-2">
                    <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Live Feed: Connected
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                        <Clock className="w-3 h-3" />
                        Last Sync: {lastUpdate}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default BreakoutBoardV1;
