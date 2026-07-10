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

export function NewBreakouts() {
    const navigate = useNavigate();
    const { intradayBreakoutScanner, lastUpdate, refresh, isLoading, stockData } = useLiveData();
    const { isFree } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [sortField, setSortField] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
    const [pinnedSymbols, setPinnedSymbols] = useState<string[]>(() => {
        const saved = localStorage.getItem("lasa_newbreakouts_pinned");
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem("lasa_newbreakouts_pinned", JSON.stringify(pinnedSymbols));
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

    const toggleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("desc");
        }
    };

    const SortIcon = ({ field }: { field: string }) => {
        if (sortField !== field) return null;
        return sortDirection === "asc" ? (
            <ChevronUp className="w-3 h-3 ml-1 inline-block" />
        ) : (
            <ChevronDown className="w-3 h-3 ml-1 inline-block" />
        );
    };

    const parseDate = (dateStr: string): Date | null => {
        let d = new Date(dateStr);
        if (!isNaN(d.getTime())) return d;
        const parts = (dateStr || '').trim().split('-');
        if (parts.length === 3) {
            const months: Record<string, number> = {jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};
            const m = months[parts[1].toLowerCase().substring(0,3)];
            if (m !== undefined) {
                let y = parseInt(parts[2], 10);
                if (y < 100) y += 2000;
                d = new Date(y, m, parseInt(parts[0], 10));
                if (!isNaN(d.getTime())) return d;
            }
        }
        return null;
    };

    const filteredStocks = useMemo(() => {
        const scannerData = intradayBreakoutScanner || [];
        if (scannerData.length === 0) return [];

        const today = new Date();
        today.setHours(0,0,0,0);

        // Group all scanner entries by symbol
        const symbolMap: Record<string, { dateObj: Date; time: string; entry: any }[]> = {};
        scannerData.forEach((scan: any) => {
            const sym = (scan.symbol || '').toString().trim().toUpperCase();
            if (!sym || sym === 'N/A') return;
            const d = parseDate(scan.date);
            if (!d) return;
            if (!symbolMap[sym]) symbolMap[sym] = [];
            symbolMap[sym].push({ dateObj: d, time: scan.time || '', entry: scan });
        });

        // For each symbol, find the latest "NEW" breakout date (gap > 30 days from prior appearance)
        let data: any[] = [];
        Object.entries(symbolMap).forEach(([sym, appearances]) => {
            // Sort by date ascending
            appearances.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

            // Find the latest "new breakout" start date
            let latestNewBadgeDate = appearances[0].dateObj;
            let latestNewBadgeTime = appearances[0].time;
            for (let i = 1; i < appearances.length; i++) {
                const diffDays = (appearances[i].dateObj.getTime() - appearances[i-1].dateObj.getTime()) / (1000 * 60 * 60 * 24);
                if (diffDays > 30) {
                    latestNewBadgeDate = appearances[i].dateObj;
                    latestNewBadgeTime = appearances[i].time;
                }
            }

            const lnbd = new Date(latestNewBadgeDate);
            lnbd.setHours(0,0,0,0);
            const daysSinceNew = (today.getTime() - lnbd.getTime()) / (1000 * 60 * 60 * 24);

            // Only include if within 15 days
            if (daysSinceNew < 0 || daysSinceNew > 15) return;

            // Use the latest scanner entry for this symbol (most recent price data)
            const latestEntry = appearances[appearances.length - 1].entry;

            data.push({
                symbol: sym,
                time: latestEntry.time || 'N/A',
                close: latestEntry.close || 0,
                boPrice: latestEntry.boPrice || 0,
                resistance: latestEntry.resistance || 0,
                MODEL: latestEntry.model || 0,
                target: latestEntry.target || 0,
                obvSignal: latestEntry.obvSignal || '—',
                fr: latestEntry.fr || '—',
                priceMove: latestEntry.u || 0,
                isPinned: pinnedSymbols.includes(sym),
                latestNewBadgeDate: lnbd,
                latestNewBadgeTime,
                daysSinceNew,
                boDateStr: `${lnbd.toLocaleDateString('en-GB', {day:'2-digit', month:'short'})} ${latestNewBadgeTime}`
            });
        });

        if (searchTerm) {
            data = data.filter(s => s.symbol.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        return data.sort((a, b) => {
            if (sortField === "fr") {
                const valA = String(a.fr || "").toLowerCase();
                const valB = String(b.fr || "").toLowerCase();
                if (valA < valB) return sortDirection === "asc" ? -1 : 1;
                if (valA > valB) return sortDirection === "asc" ? 1 : -1;
            }
            if (sortField === "boDate") {
                const valA = a.latestNewBadgeDate ? a.latestNewBadgeDate.getTime() : 0;
                const valB = b.latestNewBadgeDate ? b.latestNewBadgeDate.getTime() : 0;
                if (valA !== valB) return sortDirection === "asc" ? valA - valB : valB - valA;
            }

            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;

            // Sort by daysSinceNew ascending (newest breakouts first)
            if (a.daysSinceNew !== b.daysSinceNew) return a.daysSinceNew - b.daysSinceNew;

            return (b.time || '').localeCompare(a.time || '');
        });
    }, [intradayBreakoutScanner, searchTerm, pinnedSymbols, sortField, sortDirection]);

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
                            <h1 className="text-xl font-bold tracking-tight">New Breakouts <span className="gradient-text italic">Screener</span></h1>
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Recent breakouts (Last 15 days)</p>
                        </div>
                    </div>

                    {/* Last Update */}
                    <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 shadow-inner">
                        <div className="text-xl font-bold text-yellow-500 font-mono tracking-tighter min-w-[80px] text-center">
                            {lastUpdate ? lastUpdate.split(' ')[0] : '--:--'}
                        </div>
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
                                    <TableHead className="w-[150px] text-[11px] font-black text-white/60 uppercase tracking-widest">Symbol</TableHead>
                                    <TableHead className="text-[11px] font-black text-white/60 uppercase tracking-widest text-center cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("boDate")}>BO Date <SortIcon field="boDate" /></TableHead>
                                    <TableHead className="text-[11px] font-black text-white/60 uppercase tracking-widest text-right">Price</TableHead>
                                    <TableHead className="text-[11px] font-black text-white/60 uppercase tracking-widest text-right">BO Price</TableHead>
                                    <TableHead className="text-[11px] font-black text-white/60 uppercase tracking-widest text-right">Resistance</TableHead>
                                    <TableHead className="text-[11px] font-black text-white/60 uppercase tracking-widest text-right">Model</TableHead>
                                    <TableHead className="text-[11px] font-black text-white/60 uppercase tracking-widest text-center cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("fr")}>Obv Breakout <SortIcon field="fr" /></TableHead>
                                    <TableHead className="text-[11px] font-black text-white/60 uppercase tracking-widest text-right">% Price Inc</TableHead>
                                    <TableHead className="w-[60px] text-[11px] font-black text-white/60 uppercase tracking-widest text-center">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={10} className="h-64 text-center">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                                                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Initializing Terminal Data...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredStocks.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={10} className="h-64 text-center">
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
                                                <TableCell className="py-1">
                                                    <div className="flex flex-col leading-tight">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-sm font-black text-white tracking-tight group-hover:text-primary transition-colors">{stock.symbol}</span>
                                                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">NEW</span>
                                                        </div>
                                                        <span className="text-[8px] text-muted-foreground font-bold font-mono">{stock.time}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-1 text-center font-bold font-mono text-xs text-blue-400">
                                                    {stock.boDateStr}
                                                </TableCell>
                                                <TableCell className="py-1 text-right font-black font-mono text-sm">
                                                    ₹{formatNumber(stock.close)}
                                                </TableCell>
                                                <TableCell className="py-1 text-right font-bold font-mono text-xs text-blue-300">
                                                    ₹{formatNumber(stock.boPrice)}
                                                </TableCell>
                                                <TableCell className="py-1 text-right font-bold font-mono text-xs text-red-400/80">
                                                    ₹{formatNumber(stock.resistance)}
                                                </TableCell>
                                                <TableCell className="py-1 text-right font-bold font-mono text-xs text-orange-400/80">
                                                    ₹{formatNumber(stock.MODEL || stock.targetPrice || stock.target)}
                                                </TableCell>
                                                <TableCell className="py-1 text-center font-bold font-mono text-xs">
                                                    <span className="text-white/80">
                                                        {stock.fr || '—'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-1 text-right font-bold font-mono text-xs">
                                                    <span className={stock.priceMove > 0 ? "text-emerald-400" : stock.priceMove < 0 ? "text-rose-400" : "text-white/60"}>
                                                        {stock.priceMove !== undefined && stock.priceMove !== null && !isNaN(stock.priceMove) ? `${stock.priceMove > 0 ? '+' : ''}${stock.priceMove.toFixed(2)}%` : '—'}
                                                    </span>
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
                                                        {stockData?.some((s: any) => s.symbol === stock.symbol) && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-primary/40 hover:text-primary hover:bg-primary/10"
                                                                onClick={() => handleStockClick(stock.symbol)}
                                                            >
                                                                <BarChart2 className="w-3.5 h-3.5" />
                                                            </Button>
                                                        )}
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

export default NewBreakouts;
