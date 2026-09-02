import { useState, useMemo } from "react";
import { Search, Loader2, ChevronDown, ChevronUp, AlertCircle, RefreshCw, Calendar, Filter, Sparkles, BookOpen, Info, ShieldAlert, CheckCircle2, TrendingUp, BarChart2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { WeeklyRecommendationItem } from "@/lib/googleSheetsService";

type SortField = keyof WeeklyRecommendationItem;

function parseDateValue(dateStr: string): number {
  if (!dateStr || !dateStr.trim()) return 0;
  const str = dateStr.trim();
  const parsed = Date.parse(str);
  if (!isNaN(parsed) && parsed > 0) return parsed;

  const parts = str.split(/[-/]/);
  if (parts.length === 3) {
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const y = parseInt(parts[2], 10);
    if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
      return new Date(y < 100 ? 2000 + y : y, m, d).getTime();
    }
  }
  return 0;
}

export function WeeklyRecommendationScreener() {
  const navigate = useNavigate();
  const { weeklyRecommendation, refresh, isLoading, stockData } = useLiveData();
  const { isFree } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortField, setSortField] = useState<SortField | null>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [showStrategyGuide, setShowStrategyGuide] = useState(false);
  const [selectedDetailTile, setSelectedDetailTile] = useState<{
    stock: string;
    typeLabel: string;
    text: string;
    date?: string;
  } | null>(null);

  // Extract unique status list for filtering
  const availableStatuses = useMemo(() => {
    const statuses = new Set<string>();
    (weeklyRecommendation || []).forEach((item: WeeklyRecommendationItem) => {
      if (item.status && item.status.trim()) {
        statuses.add(item.status.trim().toUpperCase());
      }
    });
    return Array.from(statuses).sort();
  }, [weeklyRecommendation]);

  const statusOptions = useMemo(() => {
    return ["ALL", ...availableStatuses];
  }, [availableStatuses]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection(field === "date" ? "desc" : "asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="w-3 h-3 ml-1 inline-block text-cyan-400" />
    ) : (
      <ChevronDown className="w-3 h-3 ml-1 inline-block text-cyan-400" />
    );
  };

  const filteredAndSortedData = useMemo(() => {
    let data: WeeklyRecommendationItem[] = [...(weeklyRecommendation || [])];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      data = data.filter(
        item =>
          (item.date || "").toLowerCase().includes(term) ||
          item.id.toLowerCase().includes(term) ||
          (item.entryDate || "").toLowerCase().includes(term) ||
          item.status.toLowerCase().includes(term) ||
          item.reason.toLowerCase().includes(term) ||
          (item.fundamentalView || "").toLowerCase().includes(term) ||
          (item.exitReason || "").toLowerCase().includes(term) ||
          (item.exitDate || "").toLowerCase().includes(term)
      );
    }

    // Status filter dropdown
    if (statusFilter !== "ALL") {
      data = data.filter(
        item => (item.status || "").trim().toUpperCase() === statusFilter
      );
    }

    // Sorting across columns (default to date descending)
    const effectiveSortField = sortField || "date";
    const effectiveSortDir = sortField ? sortDirection : "desc";

    data.sort((a, b) => {
      const valA = (a[effectiveSortField] as string) || "";
      const valB = (b[effectiveSortField] as string) || "";

      // Handle Date fields
      if (effectiveSortField === "date" || effectiveSortField === "entryDate" || effectiveSortField === "exitDate") {
        const timeA = parseDateValue(valA);
        const timeB = parseDateValue(valB);
        if (timeA !== 0 || timeB !== 0) {
          return effectiveSortDir === "asc" ? timeA - timeB : timeB - timeA;
        }
      }

      // Helper to check if string is numeric
      const numA = parseFloat(valA.replace(/,/g, "").replace(/%/g, ""));
      const numB = parseFloat(valB.replace(/,/g, "").replace(/%/g, ""));

      const isNumA = !isNaN(numA) && !valA.includes(":") && !valA.includes("-");
      const isNumB = !isNaN(numB) && !valB.includes(":") && !valB.includes("-");

      if (isNumA && isNumB) {
        return effectiveSortDir === "asc" ? numA - numB : numB - numA;
      }

      const cmp = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
      return effectiveSortDir === "asc" ? cmp : -cmp;
    });

    return data;
  }, [weeklyRecommendation, searchTerm, statusFilter, sortField, sortDirection]);

  const getStatusBadge = (status: string) => {
    if (!status || status === "—" || status.trim() === "") {
      return <span className="text-white/40 text-xs">—</span>;
    }

    const upper = status.trim().toUpperCase();
    if (upper === "OPEN") {
      return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-black text-[10px] uppercase px-2 py-0.5">{status}</Badge>;
    }
    if (upper === "CLOSE" || upper === "CLOSED") {
      return <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/30 font-black text-[10px] uppercase px-2 py-0.5">{status}</Badge>;
    }
    if (upper.includes("TARGET") || upper.includes("HIT") || upper.includes("PROFIT") || upper.includes("WIN")) {
      return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-black text-[10px] uppercase px-2 py-0.5">{status}</Badge>;
    }
    if (upper.includes("EXIT") || upper.includes("STOPLOSS") || upper.includes("LOSS") || upper.includes("SELL") || upper.includes("STOP")) {
      return <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/30 font-black text-[10px] uppercase px-2 py-0.5">{status}</Badge>;
    }
    if (upper.includes("HOLD") || upper.includes("WAIT") || upper.includes("TRAILING") || upper.includes("TRAIL")) {
      return <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30 font-black text-[10px] uppercase px-2 py-0.5">{status}</Badge>;
    }

    return <Badge className="bg-primary/10 text-primary border-primary/30 font-black text-[10px] uppercase px-2 py-0.5">{status}</Badge>;
  };

  const handleStockClick = (symbol: string) => {
    if (stockData?.some((s: any) => s.symbol.toUpperCase() === symbol.toUpperCase())) {
      navigate(`/stocks?symbol=${symbol}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-foreground selection:bg-primary/30">
      {/* Dynamic Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      <div className="relative container mx-auto px-4 py-8 max-w-[1600px] space-y-6">

        {/* Top Disclaimer */}
        <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10 text-center">
          <p className="text-[11px] md:text-xs text-muted-foreground/80 leading-relaxed font-medium capitalize">
            Weekly recommendations are tracked for informational and portfolio management purposes. Always perform your own risk analysis.
          </p>
        </div>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white/[0.02] border border-white/10 rounded-2xl p-6 gap-6 backdrop-blur-md">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-black uppercase tracking-widest mb-1">
              <Calendar className="w-3.5 h-3.5" />
              Weekly Recommendation Screener
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase">
              WEEKLY RECOMMENDATION <span className="gradient-text italic font-bold">SCREENER</span>
            </h1>
            <p className="text-xs text-muted-foreground font-medium">
              Track weekly setups, entry levels, current market price, target returns, and technical & fundamental views.
            </p>
          </div>

          {/* Controls: Search, Status Filter & Refresh */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search symbol, view, status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-cyan-400/50 text-xs text-white placeholder:text-muted-foreground/60 transition-all"
              />
            </div>

            {/* Status Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold gap-2">
                  <Filter className="w-3.5 h-3.5 text-cyan-400" />
                  STATUS: {statusFilter}
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#0b0f19] border-white/10 text-xs font-medium">
                {statusOptions.map((opt) => (
                  <DropdownMenuItem
                    key={opt}
                    onClick={() => setStatusFilter(opt)}
                    className={`cursor-pointer hover:bg-white/10 ${statusFilter === opt ? "text-cyan-400 font-bold bg-cyan-500/10" : "text-white/80"}`}
                  >
                    {opt}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Strategy Guide Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStrategyGuide(true)}
              className="h-9 border-cyan-500/20 bg-cyan-500/10 hover:bg-cyan-500/20 text-xs font-bold text-cyan-300 gap-2"
            >
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              Strategy Rules & FAQ
            </Button>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => refresh()}
              className="h-9 border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isLoading ? 'animate-spin' : ''}`} />
              Sync
            </Button>
          </div>
        </div>

        {/* Screener Table */}
        <div className="bg-white/[0.01] border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm shadow-2xl">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/[0.03]">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-[11px] font-black text-white/60 uppercase tracking-widest cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("date")}>DATE <SortIcon field="date" /></TableHead>
                  <TableHead className="w-[130px] text-[11px] font-black text-white/60 uppercase tracking-widest cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("id")}>ID <SortIcon field="id" /></TableHead>
                  <TableHead className="text-[11px] font-black text-white/60 uppercase tracking-widest cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("entryDate")}>ENTRY DATE <SortIcon field="entryDate" /></TableHead>
                  <TableHead className="text-[11px] font-black text-white/60 uppercase tracking-widest text-right cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("buyPrice")}>BUY PRICE <SortIcon field="buyPrice" /></TableHead>
                  <TableHead className="text-[11px] font-black text-white/60 uppercase tracking-widest text-right cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("currentPrice")}>CURRENT PRICE <SortIcon field="currentPrice" /></TableHead>
                  <TableHead className="text-[11px] font-black text-white/60 uppercase tracking-widest text-center cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("profit")}>PROFIT <SortIcon field="profit" /></TableHead>
                  <TableHead className="text-[11px] font-black text-white/60 uppercase tracking-widest text-center cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("status")}>STATUS <SortIcon field="status" /></TableHead>
                  <TableHead className="min-w-[180px] text-[11px] font-black text-white/60 uppercase tracking-widest cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("reason")}>REASON <SortIcon field="reason" /></TableHead>
                  <TableHead className="min-w-[180px] text-[11px] font-black text-white/60 uppercase tracking-widest cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("fundamentalView")}>FUNDAMENTAL VIEW <SortIcon field="fundamentalView" /></TableHead>
                  <TableHead className="min-w-[140px] text-[11px] font-black text-white/60 uppercase tracking-widest cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("exitReason")}>EXIT REASON <SortIcon field="exitReason" /></TableHead>
                  <TableHead className="text-[11px] font-black text-white/60 uppercase tracking-widest text-center cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("exitDate")}>EXIT DATE <SortIcon field="exitDate" /></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                          Loading Weekly Recommendations...
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredAndSortedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <AlertCircle className="h-8 w-8 text-muted-foreground/30" />
                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                          No Records Found
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <PremiumProtector requiredTier="pro" blurLevel="md">
                    {(isFree ? filteredAndSortedData.slice(0, 10) : filteredAndSortedData).map((row, idx) => (
                      <TableRow
                        key={`${row.id}-${row.date}-${idx}`}
                        className="border-white/5 hover:bg-white/[0.04] transition-colors group cursor-pointer"
                        onClick={() => handleStockClick(row.id)}
                      >
                        <TableCell className="py-2.5 font-mono text-xs text-cyan-300 font-bold whitespace-nowrap">{row.date || "—"}</TableCell>
                        <TableCell className="py-2.5"><span className="text-sm font-black text-white tracking-tight group-hover:text-cyan-400 transition-colors">{row.id || "—"}</span></TableCell>
                        <TableCell className="py-2.5 font-mono text-xs text-white/70 whitespace-nowrap">{row.entryDate || "—"}</TableCell>
                        <TableCell className="py-2.5 text-right font-mono font-bold text-xs text-blue-300">{row.buyPrice ? row.buyPrice : "—"}</TableCell>
                        <TableCell className="py-2.5 text-right font-mono font-bold text-xs text-cyan-400">{row.currentPrice ? row.currentPrice : "—"}</TableCell>
                        <TableCell className="py-2.5 text-center font-mono font-bold text-xs">
                          {(() => {
                            const val = row.profit || "";
                            if (!val || val === "—") return <span className="text-white/40">—</span>;
                            const num = parseFloat(val.replace(/,/g, "").replace(/%/g, ""));
                            if (isNaN(num)) return <span className="text-white/80">{val}</span>;
                            if (num > 0) return <span className="text-emerald-400 font-bold">{val}%</span>;
                            if (num < 0) return <span className="text-rose-400 font-bold">{val}%</span>;
                            return <span className="text-white/80 font-bold">{val}%</span>;
                          })()}
                        </TableCell>
                        <TableCell className="py-2.5 text-center">{getStatusBadge(row.status)}</TableCell>
                        <TableCell className="py-2.5 text-xs text-white/80 max-w-[200px]">
                          {row.reason ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDetailTile({
                                  stock: row.id,
                                  typeLabel: "Technical Summary",
                                  text: row.reason,
                                  date: row.date,
                                });
                              }}
                              className="inline-flex items-center gap-1.5 max-w-full truncate px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 hover:bg-cyan-500/10 hover:border-cyan-500/30 text-white/90 transition-all cursor-pointer group/tile text-left"
                              title="Click to read full technical summary"
                            >
                              <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
                              <span className="truncate">{row.reason}</span>
                            </button>
                          ) : (
                            <span className="text-white/40">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-2.5 text-xs text-amber-300/90 max-w-[200px]">
                          {row.fundamentalView ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDetailTile({
                                  stock: row.id,
                                  typeLabel: "Fundamental View",
                                  text: row.fundamentalView,
                                  date: row.date,
                                });
                              }}
                              className="inline-flex items-center gap-1.5 max-w-full truncate px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/25 text-amber-300 transition-all cursor-pointer group/tile text-left font-medium"
                              title="Click to read full fundamental view"
                            >
                              <BookOpen className="w-3 h-3 text-amber-400 shrink-0" />
                              <span className="truncate">{row.fundamentalView}</span>
                            </button>
                          ) : (
                            <span className="text-white/40">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-2.5 text-xs text-white/70 max-w-[160px] truncate">
                          {row.exitReason ? (
                            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[11px] text-white/80 font-mono">
                              {row.exitReason}
                            </span>
                          ) : (
                            <span className="text-white/40">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-2.5 text-center font-mono text-xs text-cyan-300">{row.exitDate ? row.exitDate : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </PremiumProtector>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Footer Info */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-2">
          <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Source: INDICES • WEEKLY-RECOMMENDATION
          </div>
          <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
            Showing {filteredAndSortedData.length} records
          </div>
        </div>
      </div>

      {/* Detail Tile Modal (for Technical Summary & Fundamental View) */}
      <Dialog open={!!selectedDetailTile} onOpenChange={(open) => !open && setSelectedDetailTile(null)}>
        <DialogContent className="bg-[#0b0f19]/95 text-white border border-white/15 max-w-2xl rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
          <DialogHeader className="flex flex-col space-y-1.5 pb-3 border-b border-white/10 text-left">
            <div className="flex items-center justify-between gap-2">
              <DialogTitle className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                  {selectedDetailTile?.stock}
                </span>
                <span className="text-sm font-bold text-white/90">{selectedDetailTile?.typeLabel}</span>
              </DialogTitle>
            </div>
            {selectedDetailTile?.date && (
              <DialogDescription className="text-xs text-muted-foreground font-mono">
                Date: {selectedDetailTile.date}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="my-4 p-4 rounded-xl bg-white/[0.03] border border-white/10 text-sm leading-relaxed text-white/90 font-sans whitespace-pre-wrap break-words max-h-[60vh] overflow-y-auto selection:bg-cyan-500/30">
            {selectedDetailTile?.text}
          </div>

          <DialogFooter className="sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setSelectedDetailTile(null)}
              className="w-full sm:w-auto bg-white/5 border-white/10 hover:bg-white/10 text-white font-bold rounded-xl"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Strategy Explanation & Why Friday Modal */}
      <Dialog open={showStrategyGuide} onOpenChange={setShowStrategyGuide}>
        <DialogContent className="bg-[#0b0f19]/95 text-white border border-white/15 max-w-3xl rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
          <DialogHeader className="flex flex-col space-y-1.5 pb-3 border-b border-white/10 text-left">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black tracking-tight text-white uppercase">
                  Weekly Recommendation Strategy & Rules
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  7-Pillar Quantitative Momentum & Swing Framework
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="my-4 space-y-4 max-h-[65vh] overflow-y-auto pr-2 text-xs leading-relaxed text-white/90">
            {/* Why Friday Section */}
            <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 space-y-2">
              <h4 className="font-bold text-cyan-300 flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                Why We Check Data on Friday Close
              </h4>
              <p className="text-white/80 leading-relaxed">
                This strategy operates strictly on <strong>Weekly Candles</strong>. Technical indicators (Weekly RSI, 9/20/63 EMAs, and Weekly OBV) are only finalized once the Friday 3:30 PM IST candle is completed. Checking mid-week often produces false breakouts that reverse by Friday. Every Friday post-market, the scanner evaluates all candidate stocks to generate fresh entries for the upcoming week. During Monday–Thursday, the screener tracks open trades, CMP, and exit triggers.
              </p>
            </div>

            {/* 7 Pillars Grid */}
            <div className="space-y-3">
              <h4 className="font-bold text-white text-sm uppercase tracking-wider text-muted-foreground">
                The 7 Strategy Criteria
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-cyan-300">
                    <TrendingUp className="w-3.5 h-3.5" />
                    1. Momentum (Weekly RSI: 50 – 60)
                  </div>
                  <p className="text-white/70 text-[11px]">
                    Filters for the sweet-spot expansion band. Avoids laggards below 50 and overbought/overextended stocks above 60.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-cyan-300">
                    <BarChart2 className="w-3.5 h-3.5" />
                    2. Long-Term Trend (EMA 9 &gt; EMA 63)
                  </div>
                  <p className="text-white/70 text-[11px]">
                    Guarantees the medium-term moving average is trading safely above the long-term baseline.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-cyan-300">
                    <Sparkles className="w-3.5 h-3.5" />
                    3. Fresh Trigger (&le; 5 Weeks Old)
                  </div>
                  <p className="text-white/70 text-[11px]">
                    9-week EMA must have crossed above 20-week EMA within the last 5 weeks to ensure an early entry near the turn.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-cyan-300">
                    <BarChart2 className="w-3.5 h-3.5" />
                    4. Institutional Volume (OBV &le; 5% of High)
                  </div>
                  <p className="text-white/70 text-[11px]">
                    Weekly On-Balance Volume must sit within 5% of its 26-week high, confirming heavy institutional accumulation.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-cyan-300">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    5. 4-Week Expansion Confirmation
                  </div>
                  <p className="text-white/70 text-[11px]">
                    Evaluates 4-week price & volume deltas to verify sustained volume growth supporting the price increase.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-emerald-400">
                    <TrendingUp className="w-3.5 h-3.5" />
                    6. Profit Target (+50% Objective)
                  </div>
                  <p className="text-white/70 text-[11px]">
                    Aims for a +50% gain from the Friday entry close or a measured move from the prior weekly swing low.
                  </p>
                </div>
              </div>
            </div>

            {/* Risk Management Section */}
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-2">
              <h4 className="font-bold text-rose-400 flex items-center gap-2 text-sm">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                7. Risk Management &amp; Automated Exits
              </h4>
              <ul className="list-disc list-inside text-white/80 space-y-1 text-[11px]">
                <li><strong>Hard Stoploss (`STOP RSI&lt;40`):</strong> Triggered if the stock closes any week with RSI below 40.</li>
                <li><strong>Trailing Profit Exit (`TRAIL HA-RED`):</strong> After substantial upside/target, exits on the first red weekly Heikin-Ashi candle to lock in gains.</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setShowStrategyGuide(false)}
              className="w-full sm:w-auto bg-cyan-500/10 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 font-bold rounded-xl"
            >
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default WeeklyRecommendationScreener;
