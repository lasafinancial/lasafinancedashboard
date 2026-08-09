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
import { ExitTargetScreenerItem } from "@/lib/googleSheetsService";

type SortField = keyof ExitTargetScreenerItem;

export function ExitTargetScreener() {
  const navigate = useNavigate();
  const { exitTargetScreener, lastUpdate, refresh, isLoading, stockData } = useLiveData();
  const { isFree } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

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

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="w-3 h-3 ml-1 inline-block text-primary" />
    ) : (
      <ChevronDown className="w-3 h-3 ml-1 inline-block text-primary" />
    );
  };

  const filteredAndSortedData = useMemo(() => {
    let data: ExitTargetScreenerItem[] = [...(exitTargetScreener || [])];

    // Search filter (matches ID or Status)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      data = data.filter(
        item =>
          (item.date || "").toLowerCase().includes(term) ||
          item.id.toLowerCase().includes(term) ||
          item.status.toLowerCase().includes(term) ||
          item.reason.toLowerCase().includes(term)
      );
    }

    // Status filter dropdown
    if (statusFilter !== "ALL") {
      data = data.filter(
        item => (item.status || "").trim().toUpperCase() === statusFilter
      );
    }

    // Sorting across ALL 8 columns
    if (sortField) {
      data.sort((a, b) => {
        const valA = a[sortField] || "";
        const valB = b[sortField] || "";

        // Helper to check if string is numeric
        const numA = parseFloat(valA.replace(/,/g, "").replace(/%/g, ""));
        const numB = parseFloat(valB.replace(/,/g, "").replace(/%/g, ""));

        const isNumA = !isNaN(numA) && !valA.includes(":") && !valA.includes("-");
        const isNumB = !isNaN(numB) && !valB.includes(":") && !valB.includes("-");

        if (isNumA && isNumB) {
          return sortDirection === "asc" ? numA - numB : numB - numA;
        }

        const cmp = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
        return sortDirection === "asc" ? cmp : -cmp;
      });
    }

    return data;
  }, [exitTargetScreener, searchTerm, statusFilter, sortField, sortDirection]);

  const getStatusBadge = (status: string) => {
    if (!status || status === "—" || status.trim() === "") {
      return <span className="text-white/40 text-xs">—</span>;
    }

    const upper = status.trim().toUpperCase();
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
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="relative container mx-auto px-2 py-4 max-w-[1600px]">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-center justify-between bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 mb-4 gap-4 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-primary/20 rounded-lg border border-primary/30">
              <Crosshair className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                EXIT / TARGET <span className="gradient-text italic">SCREENER</span>
              </h1>
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                Recommendation Analysis • Exit & Target Tracker
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter */}
            {availableStatuses.length > 0 && (
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2 py-1">
                <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-xs text-white border-none focus:outline-none focus:ring-0 cursor-pointer"
                >
                  <option value="ALL" className="bg-[#020617] text-white">All Statuses</option>
                  {availableStatuses.map(st => (
                    <option key={st} value={st} className="bg-[#020617] text-white">{st}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Search Box */}
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search ID or Status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-52 pl-10 pr-4 py-1.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all text-xs"
              />
            </div>

            {/* Last Update */}
            <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 shadow-inner">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <div className="text-xs font-bold text-yellow-500 font-mono tracking-tighter">
                {lastUpdate ? lastUpdate.split(' ')[0] : '--:--'}
              </div>
            </div>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => refresh(true)}
              className="h-8 w-8 p-0 border-white/10 hover:bg-white/5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Screener Table */}
        <div className="bg-white/[0.01] border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm shadow-2xl">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/[0.03]">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead
                    className="text-[11px] font-black text-white/60 uppercase tracking-widest cursor-pointer hover:text-white transition-colors"
                    onClick={() => toggleSort("date")}
                  >
                    DATE <SortIcon field="date" />
                  </TableHead>
                  <TableHead
                    className="w-[140px] text-[11px] font-black text-white/60 uppercase tracking-widest cursor-pointer hover:text-white transition-colors"
                    onClick={() => toggleSort("id")}
                  >
                    ID <SortIcon field="id" />
                  </TableHead>
                  <TableHead
                    className="text-[11px] font-black text-white/60 uppercase tracking-widest text-right cursor-pointer hover:text-white transition-colors"
                    onClick={() => toggleSort("buyPrice")}
                  >
                    BUY PRICE <SortIcon field="buyPrice" />
                  </TableHead>
                  <TableHead
                    className="text-[11px] font-black text-white/60 uppercase tracking-widest text-right cursor-pointer hover:text-white transition-colors"
                    onClick={() => toggleSort("targetPrice")}
                  >
                    TARGET PRICE <SortIcon field="targetPrice" />
                  </TableHead>
                  <TableHead
                    className="text-[11px] font-black text-white/60 uppercase tracking-widest text-center cursor-pointer hover:text-white transition-colors"
                    onClick={() => toggleSort("targetsHit")}
                  >
                    TARGETS HIT <SortIcon field="targetsHit" />
                  </TableHead>
                  <TableHead
                    className="text-[11px] font-black text-white/60 uppercase tracking-widest text-center cursor-pointer hover:text-white transition-colors"
                    onClick={() => toggleSort("status")}
                  >
                    STATUS <SortIcon field="status" />
                  </TableHead>
                  <TableHead
                    className="min-w-[200px] text-[11px] font-black text-white/60 uppercase tracking-widest cursor-pointer hover:text-white transition-colors"
                    onClick={() => toggleSort("reason")}
                  >
                    REASON <SortIcon field="reason" />
                  </TableHead>
                  <TableHead
                    className="text-[11px] font-black text-white/60 uppercase tracking-widest text-center cursor-pointer hover:text-white transition-colors"
                    onClick={() => toggleSort("exitDate")}
                  >
                    EXIT DATE <SortIcon field="exitDate" />
                  </TableHead>
                  <TableHead
                    className="text-[11px] font-black text-white/60 uppercase tracking-widest text-right cursor-pointer hover:text-white transition-colors"
                    onClick={() => toggleSort("stoploss")}
                  >
                    STOPLOSS <SortIcon field="stoploss" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-64 text-center">
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
                    <TableCell colSpan={9} className="h-64 text-center">
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
                        {/* DATE */}
                        <TableCell className="py-2.5 font-mono text-xs text-muted-foreground whitespace-nowrap">
                          {row.date || "—"}
                        </TableCell>

                        {/* ID */}
                        <TableCell className="py-2.5">
                          <span className="text-sm font-black text-white tracking-tight group-hover:text-primary transition-colors">
                            {row.id || "—"}
                          </span>
                        </TableCell>

                        {/* 2. Buy Price */}
                        <TableCell className="py-2.5 text-right font-mono font-bold text-xs text-blue-300">
                          {row.buyPrice ? row.buyPrice : "—"}
                        </TableCell>

                        {/* 3. Target Price */}
                        <TableCell className="py-2.5 text-right font-mono font-bold text-xs text-emerald-400">
                          {row.targetPrice ? row.targetPrice : "—"}
                        </TableCell>

                        {/* 4. Targets Hit */}
                        <TableCell className="py-2.5 text-center font-mono font-bold text-xs text-amber-400">
                          {row.targetsHit ? row.targetsHit : "—"}
                        </TableCell>

                        {/* 5. Status */}
                        <TableCell className="py-2.5 text-center">
                          {getStatusBadge(row.status)}
                        </TableCell>

                        {/* 6. Reason */}
                        <TableCell className="py-2.5 text-xs text-white/80 max-w-[300px] truncate" title={row.reason}>
                          {row.reason ? row.reason : "—"}
                        </TableCell>

                        {/* 7. Exit Date */}
                        <TableCell className="py-2.5 text-center font-mono text-xs text-muted-foreground">
                          {row.exitDate ? row.exitDate : "—"}
                        </TableCell>

                        {/* 8. Stoploss */}
                        <TableCell className="py-2.5 text-right font-mono font-bold text-xs text-rose-400">
                          {row.stoploss ? row.stoploss : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </PremiumProtector>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 px-2">
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
