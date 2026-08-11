import { useState, useMemo } from "react";
import { Search, Loader2, ChevronDown, ChevronUp, AlertCircle, RefreshCw, Clock, Crosshair, Filter } from "lucide-react";
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
import { ExitTargetScreenerItem } from "@/lib/googleSheetsService";

type SortField = keyof ExitTargetScreenerItem;

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

export function ExitTargetScreener() {
  const navigate = useNavigate();
  const { exitTargetScreener, lastUpdate, refresh, isLoading, stockData } = useLiveData();
  const { isFree } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortField, setSortField] = useState<SortField | null>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Extract unique status list for filtering
  const availableStatuses = useMemo(() => {
    const statuses = new Set<string>();
    (exitTargetScreener || []).forEach((item: ExitTargetScreenerItem) => {
      if (item.status && item.status.trim()) {
        statuses.add(item.status.trim().toUpperCase());
      }
    });
    return Array.from(statuses).sort();
  }, [exitTargetScreener]);

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
      <ChevronUp className="w-3 h-3 ml-1 inline-block text-amber-400" />
    ) : (
      <ChevronDown className="w-3 h-3 ml-1 inline-block text-amber-400" />
    );
  };

  const filteredAndSortedData = useMemo(() => {
    let data: ExitTargetScreenerItem[] = [...(exitTargetScreener || [])];

    // Search filter (matches DATE, ID, Status, Reason, Exit Reason, or Exit Date)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      data = data.filter(
        item =>
          (item.date || "").toLowerCase().includes(term) ||
          item.id.toLowerCase().includes(term) ||
          item.status.toLowerCase().includes(term) ||
          item.reason.toLowerCase().includes(term) ||
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
      if (effectiveSortField === "date" || effectiveSortField === "exitDate") {
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
  }, [exitTargetScreener, searchTerm, statusFilter, sortField, sortDirection]);

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
    if (upper.includes("EXIT") || upper.includes("STOPLOSS") || upper.includes("LOSS") || upper.includes("SELL")) {
      return <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/30 font-black text-[10px] uppercase px-2 py-0.5">{status}</Badge>;
    }
    if (upper.includes("HOLD") || upper.includes("WAIT") || upper.includes("TRAILING")) {
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
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      <div className="relative container mx-auto px-4 py-8 max-w-[1600px] space-y-6">

        {/* Top Disclaimer */}
        <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-center">
          <p className="text-[11px] md:text-xs text-muted-foreground/80 leading-relaxed font-medium capitalize">
            Exit and Target recommendations are tracked for informational and portfolio management purposes. Always perform your own risk analysis.
          </p>
        </div>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white/[0.02] border border-white/10 rounded-2xl p-6 gap-6 backdrop-blur-md">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black uppercase tracking-widest mb-1">
              <Crosshair className="w-3.5 h-3.5" />
              Recommendation Screener
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase">
              RECOMMENDATION <span className="gradient-text italic font-bold">SCREENER</span>
            </h1>
            <p className="text-xs text-muted-foreground font-medium">
              Track buy prices, target hits, profit/loss status, and exit signals in real time.
            </p>
          </div>

          {/* Controls: Search, Status Filter & Refresh */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search symbol, reason, status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-400/50 text-xs text-white placeholder:text-muted-foreground/60 transition-all"
              />
            </div>

            {/* Status Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold gap-2">
                  <Filter className="w-3.5 h-3.5 text-amber-400" />
                  STATUS: {statusFilter}
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#0b0f19] border-white/10 text-xs font-medium">
                {statusOptions.map((opt) => (
                  <DropdownMenuItem
                    key={opt}
                    onClick={() => setStatusFilter(opt)}
                    className={`cursor-pointer hover:bg-white/10 ${statusFilter === opt ? "text-amber-400 font-bold bg-amber-500/10" : "text-white/80"}`}
                  >
                    {opt}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => refresh()}
              className="h-9 border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isLoading ? 'animate-spin' : ''}`} />
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
                  <TableHead className="w-[140px] text-[11px] font-black text-white/60 uppercase tracking-widest cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("id")}>ID <SortIcon field="id" /></TableHead>
                  <TableHead className="text-[11px] font-black text-white/60 uppercase tracking-widest text-right cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("buyPrice")}>BUY PRICE <SortIcon field="buyPrice" /></TableHead>
                  <TableHead className="text-[11px] font-black text-white/60 uppercase tracking-widest text-right cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("targetPrice")}>TARGET PRICE <SortIcon field="targetPrice" /></TableHead>
                  <TableHead className="text-[11px] font-black text-white/60 uppercase tracking-widest text-center cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("profit")}>PROFIT <SortIcon field="profit" /></TableHead>
                  <TableHead className="text-[11px] font-black text-white/60 uppercase tracking-widest text-center cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("status")}>STATUS <SortIcon field="status" /></TableHead>
                  <TableHead className="min-w-[180px] text-[11px] font-black text-white/60 uppercase tracking-widest cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("reason")}>REASON <SortIcon field="reason" /></TableHead>
                  <TableHead className="min-w-[180px] text-[11px] font-black text-white/60 uppercase tracking-widest cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("exitReason")}>EXIT REASON <SortIcon field="exitReason" /></TableHead>
                  <TableHead className="text-[11px] font-black text-white/60 uppercase tracking-widest text-center cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("exitDate")}>EXIT DATE <SortIcon field="exitDate" /></TableHead>
                  <TableHead className="text-[11px] font-black text-white/60 uppercase tracking-widest text-right cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("stoploss")}>STOPLOSS <SortIcon field="stoploss" /></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                          Loading Screener Data...
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredAndSortedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-64 text-center">
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
                        key={`${row.id}-${idx}`}
                        className="border-white/5 hover:bg-white/[0.04] transition-colors group cursor-pointer"
                        onClick={() => handleStockClick(row.id)}
                      >
                        <TableCell className="py-2.5 font-mono text-xs text-cyan-300 font-bold whitespace-nowrap">{row.date || "—"}</TableCell>
                        <TableCell className="py-2.5"><span className="text-sm font-black text-white tracking-tight group-hover:text-primary transition-colors">{row.id || "—"}</span></TableCell>
                        <TableCell className="py-2.5 text-right font-mono font-bold text-xs text-blue-300">{row.buyPrice ? row.buyPrice : "—"}</TableCell>
                        <TableCell className="py-2.5 text-right font-mono font-bold text-xs text-emerald-400">{row.targetPrice ? row.targetPrice : "—"}</TableCell>
                        <TableCell className="py-2.5 text-center font-mono font-bold text-xs">
                          {(() => {
                            const val = row.profit || "";
                            if (!val || val === "—") return <span className="text-white/40">—</span>;
                            const num = parseFloat(val.replace(/,/g, "").replace(/%/g, ""));
                            if (isNaN(num)) return <span className="text-white/80">{val}</span>;
                            if (num > 0) return <span className="text-emerald-400 font-bold">{val}</span>;
                            if (num < 0) return <span className="text-rose-400 font-bold">{val}</span>;
                            return <span className="text-white/80 font-bold">{val}</span>;
                          })()}
                        </TableCell>
                        <TableCell className="py-2.5 text-center">{getStatusBadge(row.status)}</TableCell>
                        <TableCell className="py-2.5 text-xs text-white/80 max-w-[200px] truncate" title={row.reason}>{row.reason ? row.reason : "—"}</TableCell>
                        <TableCell className="py-2.5 text-xs text-amber-300/90 max-w-[200px] truncate" title={row.exitReason}>{row.exitReason ? row.exitReason : "—"}</TableCell>
                        <TableCell className="py-2.5 text-center font-mono text-xs text-cyan-300">{row.exitDate ? row.exitDate : "—"}</TableCell>
                        <TableCell className="py-2.5 text-right font-mono font-bold text-xs text-rose-400">{row.stoploss ? row.stoploss : "—"}</TableCell>
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
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Source: INDICES • RECOMMENDATION
          </div>
          <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
            Showing {filteredAndSortedData.length} records
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExitTargetScreener;
