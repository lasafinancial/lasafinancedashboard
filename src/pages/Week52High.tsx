import { useState, useMemo } from "react";
import { Search, ArrowUpRight, Loader2, Sparkles, TrendingUp, TrendingDown, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
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

type SortField = "id" | "currentPrice" | "high52" | "resistance" | "support";
type SortDirection = "asc" | "desc";

export function Week52High() {
    const navigate = useNavigate();
    const { week52High: stocks, isLoading, stockData } = useLiveData();
    const { isFree } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedGroup, setSelectedGroup] = useState<string>("ALL");
    const [sortField, setSortField] = useState<SortField>("id");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

    const formatNumber = (num: number) => {
        if (num === null || num === undefined || isNaN(num) || num === 0) return "—";
        return new Intl.NumberFormat('en-IN', {
            maximumFractionDigits: 2,
            minimumFractionDigits: 2
        }).format(num);
    };

    const toggleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    // Extract available groups / categories
    const groups = useMemo(() => {
        const set = new Set<string>();
        (stocks || []).forEach(s => {
            if (s.group && s.group.trim()) {
                set.add(s.group.trim().toUpperCase());
            } else if (s.sector && s.sector.trim()) {
                set.add(s.sector.trim().toUpperCase());
            }
        });
        return Array.from(set).sort();
    }, [stocks]);

    const processedStocks = useMemo(() => {
        if (!stocks) return [];
        let data = [...stocks];

        // Filter by Category/Group
        if (selectedGroup !== "ALL") {
            data = data.filter(s => {
                const grp = (s.group || '').trim().toUpperCase();
                const sec = (s.sector || '').trim().toUpperCase();
                return grp === selectedGroup || sec === selectedGroup;
            });
        }

        // Filter by Search
        if (searchTerm) {
            const query = searchTerm.toLowerCase().trim();
            data = data.filter(s =>
                s.id.toLowerCase().includes(query) ||
                (s.sector && s.sector.toLowerCase().includes(query)) ||
                (s.group && s.group.toLowerCase().includes(query))
            );
        }

        // Sorting
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
    }, [stocks, searchTerm, selectedGroup, sortField, sortDirection]);

    const handleStockClick = (symbol: string) => {
        const cleanSymbol = symbol.replace(/[\[\]\(\):-]/g, '').trim().toUpperCase();
        navigate(`/stocks?symbol=${cleanSymbol}`);
    };

    return (
        <div className="min-h-screen bg-[#020617] text-foreground selection:bg-primary/30">
            {/* Ambient Background Glow */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-1/3 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse delay-700" />
            </div>

            <div className="relative container mx-auto px-4 py-8 pb-20">
                {/* Screener Top Disclaimer */}
                <div className="mb-6 p-3 rounded-xl bg-primary/5 border border-primary/10 text-center">
                    <p className="text-[11px] md:text-xs text-muted-foreground/80 leading-relaxed font-medium">
                        Stocks shown are filtered based on the selected analytical criteria and do not constitute buy or sell recommendations. No ranking or prioritization is implied.
                    </p>
                </div>

                {/* Header with Quick Toggle Tabs */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
                                <TrendingUp className="w-3.5 h-3.5" />
                                Screener: 52 Week High
                            </div>
                            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white flex items-center gap-3">
                                52 WEEK <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">HIGH</span>
                            </h1>
                            <p className="text-muted-foreground text-sm mt-1">
                                Stocks currently trading within 5% of their 52-week high with key structural support and resistance levels.
                            </p>
                        </div>

                        {/* Quick Screeners Switcher */}
                        <div className="flex items-center gap-2 self-start lg:self-center bg-white/5 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
                            <button
                                className="px-4 py-2 rounded-xl text-xs font-black tracking-wide bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                            >
                                <TrendingUp className="w-3.5 h-3.5" />
                                52W High ({stocks?.length || 0})
                            </button>
                            <Link
                                to="/screeners/52-week-low"
                                className="px-4 py-2 rounded-xl text-xs font-bold tracking-wide text-white/70 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
                            >
                                <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                                52W Low
                            </Link>
                        </div>
                    </div>
                </motion.div>

                {/* Filters and Controls */}
                <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between mb-6">
                    {/* Category Filter Pills */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
                        <button
                            onClick={() => setSelectedGroup("ALL")}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                                selectedGroup === "ALL"
                                    ? "bg-emerald-500 text-black font-black shadow-lg shadow-emerald-500/20"
                                    : "bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border border-white/10"
                            }`}
                        >
                            All ({stocks?.length || 0})
                        </button>
                        {groups.map(grp => {
                            const count = (stocks || []).filter(s => (s.group || '').trim().toUpperCase() === grp || (s.sector || '').trim().toUpperCase() === grp).length;
                            return (
                                <button
                                    key={grp}
                                    onClick={() => setSelectedGroup(grp)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                                        selectedGroup === grp
                                            ? "bg-emerald-500 text-black font-black shadow-lg shadow-emerald-500/20"
                                            : "bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border border-white/10"
                                    }`}
                                >
                                    {grp} ({count})
                                </button>
                            );
                        })}
                    </div>

                    {/* Search Input */}
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                            type="text"
                            placeholder="Search symbol or sector..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 backdrop-blur-md"
                        />
                    </div>
                </div>

                {/* Table Section */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                        <p className="text-sm font-medium text-white/60">Scanning 52-week high levels...</p>
                    </div>
                ) : processedStocks.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-12 text-center">
                        <TrendingUp className="w-12 h-12 text-white/20 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-white mb-1">No matching stocks found</h3>
                        <p className="text-sm text-white/50 max-w-sm mx-auto">
                            No stocks are currently within 5% of their 52-week high matching your search criteria.
                        </p>
                    </div>
                ) : (
                    <div className="relative rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl overflow-hidden shadow-2xl">
                        {/* Table Summary Bar */}
                        <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-white/[0.02] text-xs text-white/60 font-medium">
                            <div>
                                Showing <span className="text-white font-bold">{processedStocks.length}</span> stocks near 52-week high
                            </div>
                            <div className="text-[11px] text-white/40 font-mono">
                                Column FT = 'Y' (within 5% of 52W High)
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-white/10 hover:bg-transparent">
                                        <TableHead
                                            onClick={() => toggleSort("id")}
                                            className="text-[11px] font-black text-white/60 uppercase tracking-widest cursor-pointer hover:text-white transition-colors"
                                        >
                                            <span className="flex items-center gap-1.5">
                                                ID
                                                {sortField === "id" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                            </span>
                                        </TableHead>
                                        <TableHead
                                            onClick={() => toggleSort("currentPrice")}
                                            className="text-[11px] font-black text-white/60 uppercase tracking-widest text-right cursor-pointer hover:text-white transition-colors"
                                        >
                                            <span className="flex items-center justify-end gap-1.5">
                                                Current Price
                                                {sortField === "currentPrice" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                            </span>
                                        </TableHead>
                                        <TableHead
                                            onClick={() => toggleSort("high52")}
                                            className="text-[11px] font-black text-white/60 uppercase tracking-widest text-right cursor-pointer hover:text-white transition-colors"
                                        >
                                            <span className="flex items-center justify-end gap-1.5">
                                                52 Week High
                                                {sortField === "high52" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                            </span>
                                        </TableHead>
                                        <TableHead
                                            onClick={() => toggleSort("resistance")}
                                            className="text-[11px] font-black text-white/60 uppercase tracking-widest text-right cursor-pointer hover:text-white transition-colors"
                                        >
                                            <span className="flex items-center justify-end gap-1.5">
                                                Resistance
                                                {sortField === "resistance" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                            </span>
                                        </TableHead>
                                        <TableHead
                                            onClick={() => toggleSort("support")}
                                            className="text-[11px] font-black text-white/60 uppercase tracking-widest text-right cursor-pointer hover:text-white transition-colors"
                                        >
                                            <span className="flex items-center justify-end gap-1.5">
                                                Support
                                                {sortField === "support" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                            </span>
                                        </TableHead>
                                        <TableHead className="w-[80px] text-[11px] font-black text-white/60 uppercase tracking-widest text-center">
                                            Action
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <PremiumProtector requiredTier="pro" blurLevel="md" title="Premium Feature" description="Upgrade to view all 52 Week High data.">
                                        {(isFree ? processedStocks.slice(0, 10) : processedStocks).map((stock) => {
                                            return (
                                                <TableRow
                                                    key={stock.id}
                                                    className="border-white/5 hover:bg-white/[0.04] transition-colors group cursor-pointer"
                                                    onClick={() => handleStockClick(stock.id)}
                                                >
                                                    {/* ID / Symbol */}
                                                    <TableCell className="py-3.5">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-black text-white tracking-tight group-hover:text-emerald-400 transition-colors">
                                                                {stock.id}
                                                            </span>
                                                            {stock.sector && stock.sector !== stock.id && (
                                                                <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">
                                                                    {stock.sector}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>

                                                    {/* Current Price */}
                                                    <TableCell className="py-3.5 text-right font-black tabular-nums text-sm text-white">
                                                        ₹{formatNumber(stock.currentPrice)}
                                                    </TableCell>

                                                    {/* 52 Week High */}
                                                    <TableCell className="py-3.5 text-right font-black tabular-nums text-sm text-emerald-400">
                                                        ₹{formatNumber(stock.high52)}
                                                    </TableCell>

                                                    {/* Resistance */}
                                                    <TableCell className="py-3.5 text-right font-bold tabular-nums text-xs text-rose-400">
                                                        ₹{formatNumber(stock.resistance)}
                                                    </TableCell>

                                                    {/* Support */}
                                                    <TableCell className="py-3.5 text-right font-bold tabular-nums text-xs text-emerald-400">
                                                        ₹{formatNumber(stock.support)}
                                                    </TableCell>

                                                    {/* Action */}
                                                    <TableCell className="py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            onClick={() => handleStockClick(stock.id)}
                                                            className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-emerald-500 hover:text-black hover:border-emerald-500 transition-all duration-200"
                                                            title={`View ${stock.id} chart and analysis`}
                                                        >
                                                            <ArrowUpRight className="w-3.5 h-3.5" />
                                                        </button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </PremiumProtector>
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
export default Week52High;
