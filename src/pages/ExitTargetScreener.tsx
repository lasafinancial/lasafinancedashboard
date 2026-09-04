import { useState, useMemo } from "react";
import { Search, Loader2, RefreshCw, Crosshair, TrendingUp, TrendingDown, ShieldAlert, CheckCircle2, ChevronRight, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLiveData } from "@/hooks/useLiveData";
import { PremiumProtector } from "@/components/ui/PremiumProtector";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ExitTargetScreenerItem } from "@/lib/googleSheetsService";

type CategoryTab = "ALL" | "OPEN" | "CLOSE";
type SortField = "date" | "profit" | "id" | "buyPrice" | "targetPrice" | "currentPrice";

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

function parseNumber(val: string | number | undefined | null): number {
  if (val === undefined || val === null) return 0;
  const num = parseFloat(val.toString().replace(/,/g, "").replace(/%/g, "").trim());
  return isNaN(num) ? 0 : num;
}

export function ExitTargetScreener() {
  const navigate = useNavigate();
  const { exitTargetScreener, refresh, isLoading, stockData } = useLiveData();
  const { isFree } = useAuth();
  
  const [activeTab, setActiveTab] = useState<CategoryTab>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  
  // Selected stock report detail modal
  const [selectedStock, setSelectedStock] = useState<ExitTargetScreenerItem | null>(null);

  // Map of symbol -> stock full name
  const stockNameMap = useMemo(() => {
    const map = new Map<string, string>();
    (stockData || []).forEach((s: any) => {
      if (s.symbol) {
        map.set(s.symbol.toUpperCase(), s.name || s.symbol);
      }
    });
    return map;
  }, [stockData]);

  // Tab counts
  const tabCounts = useMemo(() => {
    let all = 0, open = 0, close = 0;
    (exitTargetScreener || []).forEach((item: ExitTargetScreenerItem) => {
      all++;
      const st = (item.status || "").trim().toUpperCase();
      if (st === "OPEN") {
        open++;
      } else if (st === "CLOSE" || st === "CLOSED" || st.includes("EXIT") || st.includes("HIT") || st.includes("TARGET")) {
        close++;
      } else {
        open++;
      }
    });
    return { all, open, close };
  }, [exitTargetScreener]);

  // Filtered and sorted data
  const processedData = useMemo(() => {
    let list: ExitTargetScreenerItem[] = [...(exitTargetScreener || [])];

    // Category Tab Filtering
    if (activeTab === "OPEN") {
      list = list.filter(item => {
        const st = (item.status || "").trim().toUpperCase();
        return st === "OPEN";
      });
    } else if (activeTab === "CLOSE") {
      list = list.filter(item => {
        const st = (item.status || "").trim().toUpperCase();
        return st === "CLOSE" || st === "CLOSED" || st.includes("EXIT") || st.includes("HIT") || st.includes("TARGET");
      });
    }

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      list = list.filter(item => {
        const sym = item.id.toLowerCase();
        const name = (stockNameMap.get(item.id.toUpperCase()) || "").toLowerCase();
        const reason = (item.reason || "").toLowerCase();
        const date = (item.date || "").toLowerCase();
        const exitReason = (item.exitReason || "").toLowerCase();
        return sym.includes(term) || name.includes(term) || reason.includes(term) || date.includes(term) || exitReason.includes(term);
      });
    }

    // Sorting
    list.sort((a, b) => {
      if (sortField === "date") {
        const timeA = parseDateValue(a.date);
        const timeB = parseDateValue(b.date);
        return sortDirection === "asc" ? timeA - timeB : timeB - timeA;
      }
      if (sortField === "profit") {
        const pA = parseNumber(a.profit);
        const pB = parseNumber(b.profit);
        return sortDirection === "asc" ? pA - pB : pB - pA;
      }
      if (sortField === "buyPrice") {
        const numA = parseNumber(a.buyPrice);
        const numB = parseNumber(b.buyPrice);
        return sortDirection === "asc" ? numA - numB : numB - numA;
      }
      if (sortField === "targetPrice") {
        const numA = parseNumber(a.targetPrice);
        const numB = parseNumber(b.targetPrice);
        return sortDirection === "asc" ? numA - numB : numB - numA;
      }
      if (sortField === "currentPrice") {
        const numA = parseNumber(a.currentPrice);
        const numB = parseNumber(b.currentPrice);
        return sortDirection === "asc" ? numA - numB : numB - numA;
      }
      const sA = (a.id || "").toLowerCase();
      const sB = (b.id || "").toLowerCase();
      return sortDirection === "asc" ? sA.localeCompare(sB) : sB.localeCompare(sA);
    });

    return list;
  }, [exitTargetScreener, activeTab, searchTerm, sortField, sortDirection, stockNameMap]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection(field === "date" || field === "profit" ? "desc" : "asc");
    }
  };

  const getStatusDisplay = (item: ExitTargetScreenerItem) => {
    const statusUpper = (item.status || "").trim().toUpperCase();
    const isTargetHit = statusUpper.includes("TARGET") || statusUpper.includes("HIT") || (item.targetsHit && item.targetsHit.toUpperCase() === "TRUE");
    const isClosed = statusUpper === "CLOSE" || statusUpper === "CLOSED" || statusUpper.includes("EXIT");

    if (isTargetHit) {
      return {
        label: `Target Hit${item.exitDate ? `: ${item.exitDate}` : ""}`,
        badgeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
        dotClass: "bg-emerald-400",
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
      };
    }
    if (isClosed) {
      return {
        label: item.exitReason ? `Closing: ${item.exitReason}` : `Closing Trade${item.exitDate ? ` (${item.exitDate})` : ""}`,
        badgeClass: "border-rose-500/30 bg-rose-500/10 text-rose-400",
        dotClass: "bg-rose-400",
        icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
      };
    }
    return {
      label: "Ongoing Trade",
      badgeClass: "border-indigo-500/30 bg-indigo-500/10 text-indigo-300",
      dotClass: "bg-indigo-400",
      icon: <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
    };
  };

  const renderReturnBadge = (profitStr: string | undefined) => {
    if (!profitStr || profitStr === "—" || profitStr.trim() === "") {
      return (
        <div className="text-right">
          <span className="text-sm font-black text-white/50">—</span>
          <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Returns</div>
        </div>
      );
    }
    const num = parseNumber(profitStr);
    const isPos = num > 0;
    const isNeg = num < 0;

    return (
      <div className="text-right">
        <div className={`flex items-center justify-end gap-1 text-sm font-black tracking-tight ${isPos ? 'text-emerald-400' : isNeg ? 'text-rose-400' : 'text-white/80'}`}>
          {isPos && <TrendingUp className="w-3.5 h-3.5" />}
          {isNeg && <TrendingDown className="w-3.5 h-3.5" />}
          <span>{isPos ? `+${num.toFixed(1)}%` : `${num.toFixed(1)}%`}</span>
        </div>
        <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Returns</div>
      </div>
    );
  };

  const renderFormattedPoints = (text: string | undefined, theme: "cyan" | "amber" = "cyan") => {
    if (!text || text.trim() === "") return null;
    const str = text.trim();

    const headerRegex = /(?:^|[\.\s])(?:([1-9])[\.\)]\s*)?([A-Z][A-Z0-9\s\/_]{2,25}):/g;
    const matches: Array<{ index: number; header: string }> = [];
    let m: RegExpExecArray | null;

    while ((m = headerRegex.exec(str)) !== null) {
      const rawHeader = m[2].trim();
      if (/^[A-Z][A-Z\s\/_]+$/.test(rawHeader)) {
        matches.push({
          index: m.index + m[0].indexOf(m[1] ? m[1] : m[2]),
          header: rawHeader
        });
      }
    }

    const isCyan = theme === "cyan";
    const numBadgeClass = isCyan
      ? "text-cyan-300 bg-cyan-500/10 border-cyan-500/30"
      : "text-amber-400 bg-amber-400/10 border-amber-400/20";
    const headerClass = isCyan ? "text-cyan-300" : "text-amber-300";
    const cardBorderHover = isCyan ? "hover:border-cyan-400/30" : "hover:border-amber-400/30";

    if (matches.length === 0) {
      if (str.includes("\n")) {
        const lines = str.split("\n").map(l => l.trim().replace(/^[•\-\*]\s*/, "")).filter(Boolean);
        return (
          <div className="grid grid-cols-1 gap-2">
            {lines.map((line, idx) => (
              <div key={idx} className={`p-2.5 rounded-lg bg-black/40 border border-white/5 ${cardBorderHover} transition-colors`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`font-mono text-[9px] font-black px-1.5 py-0.5 rounded border ${numBadgeClass}`}>
                    {idx + 1}
                  </span>
                </div>
                <p className="text-white/80 text-[11px] leading-relaxed font-sans">{line}</p>
              </div>
            ))}
          </div>
        );
      }
      return (
        <p className="text-white/80 text-[11px] leading-relaxed whitespace-pre-wrap font-sans">
          {str}
        </p>
      );
    }

    const intro = str.slice(0, matches[0].index).trim();
    const items: Array<{ header: string; body: string }> = [];

    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].index;
      const end = i + 1 < matches.length ? matches[i + 1].index : str.length;
      const chunk = str.slice(start, end).trim();
      const colonIdx = chunk.indexOf(":");
      const body = colonIdx !== -1 ? chunk.slice(colonIdx + 1).trim() : chunk;

      items.push({
        header: matches[i].header,
        body
      });
    }

    return (
      <div className="space-y-2.5">
        {intro.length > 0 && (
          <p className="text-white/85 text-[11px] leading-relaxed font-sans pb-1.5 border-b border-white/5">
            {intro}
          </p>
        )}
        <div className="grid grid-cols-1 gap-2">
          {items.map((item, idx) => (
            <div key={idx} className={`p-2.5 rounded-lg bg-black/40 border border-white/5 ${cardBorderHover} transition-colors`}>
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`font-mono text-[9px] font-black px-1.5 py-0.5 rounded border ${numBadgeClass}`}>
                  {idx + 1}
                </span>
                <span className={`font-bold text-[10.5px] tracking-wide uppercase ${headerClass}`}>
                  {item.header}
                </span>
              </div>
              <p className="text-white/80 text-[11px] leading-relaxed font-sans">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#020617] text-foreground selection:bg-primary/30 font-sans pb-16">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      <div className="relative container mx-auto px-4 py-8 max-w-4xl space-y-6">

        {/* Header Title Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black uppercase tracking-widest mb-1.5">
              <Crosshair className="w-3.5 h-3.5" />
              Short Term Swing Trades
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase">
              SHORT TERM <span className="gradient-text italic font-bold">TRADES</span>
            </h1>
            <p className="text-xs text-muted-foreground font-semibold mt-1">
              Holding 1–4 Weeks
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refresh()}
            className="h-9 border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold gap-2 self-end md:self-auto text-white/90 rounded-xl"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isLoading ? 'animate-spin' : ''}`} />
            Sync
          </Button>
        </div>

        {/* Category Tabs (All, Ongoing, Exited) - Fit on screen without scrollbar */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 border-b border-white/10 pb-3 w-full">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`w-full justify-center px-2 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 sm:gap-2 ${
              activeTab === "ALL"
                ? "bg-white/10 text-white border border-white/20 shadow-lg shadow-white/5 font-black"
                : "bg-white/[0.02] text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
            }`}
          >
            <span className="truncate">All Trades</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] shrink-0 ${activeTab === 'ALL' ? 'bg-amber-400/20 text-amber-300' : 'bg-white/5 text-white/40'}`}>
              {tabCounts.all}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("OPEN")}
            className={`w-full justify-center px-2 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 sm:gap-2 ${
              activeTab === "OPEN"
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-lg shadow-indigo-500/10 font-black"
                : "bg-white/[0.02] text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
            }`}
          >
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-indigo-400 shrink-0" />
            <span className="truncate">Ongoing</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] shrink-0 ${activeTab === 'OPEN' ? 'bg-indigo-400/20 text-indigo-200 font-bold' : 'bg-white/5 text-white/40'}`}>
              {tabCounts.open}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("CLOSE")}
            className={`w-full justify-center px-2 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 sm:gap-2 ${
              activeTab === "CLOSE"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-lg shadow-emerald-500/10 font-black"
                : "bg-white/[0.02] text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
            }`}
          >
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 shrink-0" />
            <span className="truncate">Closing</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] shrink-0 ${activeTab === 'CLOSE' ? 'bg-emerald-400/20 text-emerald-200 font-bold' : 'bg-white/5 text-white/40'}`}>
              {tabCounts.close}
            </span>
          </button>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search symbol, company name, reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-[#0b0f19]/80 border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-400/50 text-xs text-white placeholder:text-muted-foreground/60 transition-all shadow-inner"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">Sort:</span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleSort("date")}
                className={`h-8 px-2.5 text-[11px] rounded-lg border-white/10 ${sortField === 'date' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 font-bold' : 'bg-white/5 text-white/70'}`}
              >
                Date {sortField === 'date' && (sortDirection === 'desc' ? '▾' : '▴')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleSort("profit")}
                className={`h-8 px-2.5 text-[11px] rounded-lg border-white/10 ${sortField === 'profit' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 font-bold' : 'bg-white/5 text-white/70'}`}
              >
                Returns {sortField === 'profit' && (sortDirection === 'desc' ? '▾' : '▴')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleSort("id")}
                className={`h-8 px-2.5 text-[11px] rounded-lg border-white/10 ${sortField === 'id' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 font-bold' : 'bg-white/5 text-white/70'}`}
              >
                Symbol {sortField === 'id' && (sortDirection === 'desc' ? '▾' : '▴')}
              </Button>
            </div>
          </div>
        </div>

        {/* Card Feed List */}
        <div className="space-y-3.5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white/[0.01] border border-white/10 rounded-2xl gap-3">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                Loading Short Term Trades...
              </p>
            </div>
          ) : processedData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white/[0.01] border border-white/10 rounded-2xl text-center gap-2">
              <AlertCircle className="w-10 h-10 text-muted-foreground/30" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">No Short Term Trades Found</h3>
              <p className="text-xs text-muted-foreground">Try adjusting your category filter or search keyword.</p>
            </div>
          ) : (
            <PremiumProtector requiredTier="pro" blurLevel="md">
              {(isFree ? processedData.slice(0, 8) : processedData).map((item, idx) => {
                const statusMeta = getStatusDisplay(item);
                const isExited = (item.status || "").trim().toUpperCase() === "CLOSE" || 
                                 (item.status || "").trim().toUpperCase() === "CLOSED" || 
                                 (item.status || "").trim().toUpperCase().includes("EXIT");
                const companyName = stockNameMap.get(item.id.toUpperCase()) || item.id;
                const initials = item.id.slice(0, 2).toUpperCase();

                return (
                  <div
                    key={`${item.id}-${idx}`}
                    onClick={() => setSelectedStock(item)}
                    className="group relative bg-[#0b0f19]/90 border border-white/10 hover:border-amber-400/40 rounded-2xl p-4 md:p-5 transition-all duration-200 hover:shadow-xl hover:shadow-amber-500/5 cursor-pointer backdrop-blur-md"
                  >
                    {/* Top Row: Status Banner & Chevron */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold tracking-wide ${statusMeta.badgeClass}`}>
                        {statusMeta.icon}
                        <span>{statusMeta.label}</span>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-amber-400 transition-colors">
                        <span className="text-[11px] font-medium hidden sm:inline">View Report</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Middle Row: Stock Avatar + Symbol & Company + Returns */}
                    <div className="flex items-center justify-between gap-3 mb-3.5">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar */}
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/15 flex items-center justify-center font-black text-sm text-white shrink-0 shadow-inner group-hover:border-amber-400/50 group-hover:scale-105 transition-all">
                          {initials}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base md:text-lg font-black text-white tracking-tight group-hover:text-amber-300 transition-colors truncate">
                              {item.id}
                            </h3>
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-300">
                              Short Term
                            </span>
                            {item.date && (
                              <span className="px-2 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-[10px] font-bold text-blue-300">
                                Initiated: {item.date}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate max-w-[220px] md:max-w-md font-medium">
                            {companyName}
                          </p>
                        </div>
                      </div>

                      {/* Return Metric */}
                      <div className="shrink-0">
                        {renderReturnBadge(item.profit)}
                      </div>
                    </div>

                    {/* Price Key Statistics Bar */}
                    <div className="grid grid-cols-4 gap-1.5 py-2.5 px-3 rounded-xl bg-white/[0.02] border border-white/5 mb-3 text-xs">
                      <div>
                        <div className="text-[10px] text-muted-foreground font-semibold uppercase truncate">Buy Price</div>
                        <div className="font-mono font-bold text-blue-300">
                          {item.buyPrice ? `₹${item.buyPrice}` : "—"}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-muted-foreground font-semibold uppercase truncate">
                          {isExited ? "Closing Price" : "Current"}
                        </div>
                        <div className={`font-mono font-bold ${isExited ? "text-rose-300" : "text-cyan-300"}`}>
                          {isExited
                            ? (item.exitPrice || item.currentPrice ? `₹${item.exitPrice || item.currentPrice}` : "—")
                            : (item.currentPrice ? `₹${item.currentPrice}` : "—")}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-muted-foreground font-semibold uppercase truncate">Target</div>
                        <div className="font-mono font-bold text-emerald-400">
                          {item.targetPrice ? `₹${item.targetPrice}` : "—"}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] text-muted-foreground font-semibold uppercase truncate">Holding</div>
                        <div className="font-mono font-bold text-amber-300">
                          {item.holdingDays && parseNumber(item.holdingDays) > 0 ? `${item.holdingDays}d` : "—"}
                        </div>
                      </div>
                    </div>

                    {/* Footer Row: LASA Branding & Entry Date & Holding Period */}
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground/80 pt-2 border-t border-white/5 flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 font-medium text-white/70">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400/80" />
                        <span>LASA Research (SEBI RA)</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[11px] flex-wrap">
                        {item.holdingDays && parseNumber(item.holdingDays) > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold text-[10px]">
                            {item.holdingDays} Days
                          </span>
                        )}
                        <span>Initiated: <strong className="text-blue-300 font-bold">{item.date || "—"}</strong></span>
                        {isExited && item.exitDate && (
                          <span className="text-rose-300">• Closing: <strong className="font-bold">{item.exitDate}</strong></span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </PremiumProtector>
          )}
        </div>

        {/* Footer Info */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-2 pt-4 border-t border-white/5 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Source: Short Term Trades Engine
          </div>
          <div>
            Showing {processedData.length} records
          </div>
        </div>
      </div>

      {/* Stock Report Detail Modal (Liquide-inspired) */}
      <Dialog open={!!selectedStock} onOpenChange={(open) => !open && setSelectedStock(null)}>
        <DialogContent className="bg-[#0b0f19]/98 text-white border border-white/15 w-[94vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl rounded-2xl p-4 sm:p-6 shadow-2xl backdrop-blur-2xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
          {selectedStock && (() => {
            const isExitedModal = (selectedStock.status || "").trim().toUpperCase() === "CLOSE" || 
                                 (selectedStock.status || "").trim().toUpperCase() === "CLOSED" || 
                                 (selectedStock.status || "").trim().toUpperCase().includes("EXIT");
            return (
              <div className="space-y-5">
                {/* Modal Header */}
                <DialogHeader className="space-y-1 text-left border-b border-white/10 pb-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-black text-amber-300 text-base shrink-0">
                        {selectedStock.id.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <DialogTitle className="text-xl font-black text-white tracking-tight">
                            {selectedStock.id}
                          </DialogTitle>
                          <Badge className={isExitedModal 
                            ? "bg-rose-500/20 text-rose-300 border-rose-500/40 text-[10px] font-black uppercase px-2 py-0.5" 
                            : "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px] font-black uppercase px-2 py-0.5"}>
                            {isExitedModal ? "CLOSED" : "BUY • ONGOING"}
                          </Badge>
                          {selectedStock.date && (
                            <span className="px-2 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-[10px] font-bold text-blue-300">
                              Initiated: {selectedStock.date}
                            </span>
                          )}
                          {isExitedModal && selectedStock.exitDate && (
                            <span className="px-2 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/30 text-[10px] font-bold text-rose-300">
                              Closing: {selectedStock.exitDate}
                            </span>
                          )}
                        </div>
                        <DialogDescription className="text-xs text-muted-foreground font-medium">
                          {stockNameMap.get(selectedStock.id.toUpperCase()) || selectedStock.id}
                        </DialogDescription>
                      </div>
                    </div>
                  </div>
                </DialogHeader>

                {/* 5 Summary Metric Tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-2.5">
                  <div className="p-2.5 sm:p-3 rounded-xl bg-white/[0.03] border border-white/10 text-center">
                    <div className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mb-1 whitespace-nowrap">
                      Buy Price
                    </div>
                    <div className="font-mono font-bold text-xs sm:text-sm text-blue-300 whitespace-nowrap">
                      {selectedStock.buyPrice ? `₹${selectedStock.buyPrice}` : "—"}
                    </div>
                  </div>

                  <div className="p-2.5 sm:p-3 rounded-xl bg-white/[0.03] border border-white/10 text-center">
                    <div className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mb-1 whitespace-nowrap">
                      Target Price
                    </div>
                    <div className="font-mono font-bold text-xs sm:text-sm text-emerald-400 whitespace-nowrap">
                      {selectedStock.targetPrice ? `₹${selectedStock.targetPrice}` : "—"}
                    </div>
                  </div>

                  <div className="p-2.5 sm:p-3 rounded-xl bg-white/[0.03] border border-white/10 text-center">
                    <div className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mb-1 whitespace-nowrap">
                      Stop Loss
                    </div>
                    <div className="font-mono font-bold text-xs sm:text-sm text-rose-400 whitespace-nowrap">
                      {selectedStock.stoploss ? `₹${selectedStock.stoploss}` : "—"}
                    </div>
                  </div>

                  <div className="p-2.5 sm:p-3 rounded-xl bg-white/[0.03] border border-white/10 text-center">
                    <div className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mb-1 whitespace-nowrap">
                      {isExitedModal ? "Closing Price" : "Current Price"}
                    </div>
                    <div className={`font-mono font-bold text-xs sm:text-sm whitespace-nowrap ${isExitedModal ? "text-rose-300" : "text-cyan-300"}`}>
                      {isExitedModal
                        ? (selectedStock.exitPrice || selectedStock.currentPrice ? `₹${selectedStock.exitPrice || selectedStock.currentPrice}` : "—")
                        : (selectedStock.currentPrice ? `₹${selectedStock.currentPrice}` : "—")}
                    </div>
                  </div>

                  <div className="p-2.5 sm:p-3 rounded-xl bg-white/[0.03] border border-white/10 text-center col-span-2 sm:col-span-1">
                    <div className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mb-1 whitespace-nowrap">
                      Holding Period
                    </div>
                    <div className="font-mono font-bold text-xs sm:text-sm text-amber-300 whitespace-nowrap">
                      {selectedStock.holdingDays && parseNumber(selectedStock.holdingDays) > 0 ? `${selectedStock.holdingDays} Days` : "—"}
                    </div>
                  </div>
                </div>

              {/* Status & Return Highlight */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/10">
                <div className="space-y-0.5">
                  <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Short Term Swing Trade Framework</div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    {getStatusDisplay(selectedStock).icon}
                    <span>{selectedStock.status || "OPEN"}</span>
                  </div>
                </div>

                <div className="text-right space-y-0.5">
                  <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Total Return</div>
                  <div className="text-xs font-bold font-mono">
                    {(() => {
                      const p = parseNumber(selectedStock.profit);
                      if (p > 0) return <span className="text-emerald-400">+{p.toFixed(1)}%</span>;
                      if (p < 0) return <span className="text-rose-400">{p.toFixed(1)}%</span>;
                      return <span className="text-white/60">{selectedStock.profit || "—"}</span>;
                    })()}
                  </div>
                </div>
              </div>

              {/* Technical Analysis */}
              <div className="space-y-4 pt-1">
                {/* 1. Trade Setup & Horizon Overview */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-muted-foreground uppercase tracking-wider">Trading Horizon</span>
                    <span className="font-bold text-amber-300 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">Short Term (1 – 4 Weeks)</span>
                  </div>
                  <div className="flex items-center justify-between text-xs border-t border-white/5 pt-2">
                    <span className="font-bold text-muted-foreground uppercase tracking-wider">Initiation Date</span>
                    <span className="font-mono font-bold text-blue-300">{selectedStock.date || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs border-t border-white/5 pt-2">
                    <span className="font-bold text-muted-foreground uppercase tracking-wider">Holding Period</span>
                    <span className="font-mono font-bold text-amber-300">
                      {selectedStock.holdingDays && parseNumber(selectedStock.holdingDays) > 0 ? `${selectedStock.holdingDays} Days` : "—"}
                    </span>
                  </div>
                  {selectedStock.exitDate && (
                    <div className="flex items-center justify-between text-xs border-t border-white/5 pt-2">
                      <span className="font-bold text-muted-foreground uppercase tracking-wider">Closing Date</span>
                      <span className="font-mono font-bold text-rose-300">{selectedStock.exitDate}</span>
                    </div>
                  )}
                  {(() => {
                    const buy = parseNumber(selectedStock.buyPrice);
                    const target = parseNumber(selectedStock.targetPrice);
                    const sl = parseNumber(selectedStock.stoploss);
                    if (buy > 0 && target > buy && sl > 0 && sl < buy) {
                      const reward = target - buy;
                      const risk = buy - sl;
                      const rr = (reward / risk).toFixed(1);
                      return (
                        <div className="flex items-center justify-between text-xs border-t border-white/5 pt-2">
                          <span className="font-bold text-muted-foreground uppercase tracking-wider">Risk / Reward Ratio</span>
                          <span className="font-mono font-bold text-emerald-400">1 : {rr}</span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* 2. Technical Analysis Breakdown */}
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-400">
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                    <span>Technical Analysis &amp; Indicators</span>
                  </div>

                  <div className="space-y-2.5 text-xs text-white/90">
                    {/* EMA Structure */}
                    <div className="p-2.5 rounded-lg bg-black/30 border border-white/5 space-y-1">
                      <div className="font-bold text-amber-300/90 text-[11px] flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Trend Structure &amp; Moving Averages (EMA)
                      </div>
                      <p className="text-white/70 text-[11px] leading-relaxed">
                        Price action confirms sustained trend alignment above key moving averages (EMA 9 / 20 / 63), signaling active buyer dominance.
                      </p>
                    </div>

                    {/* Momentum & Breakout */}
                    <div className="p-2.5 rounded-lg bg-black/30 border border-white/5 space-y-1">
                      <div className="font-bold text-amber-300/90 text-[11px] flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Momentum &amp; Volume Expansion
                      </div>
                      <p className="text-white/70 text-[11px] leading-relaxed">
                        On-balance institutional accumulation and momentum oscillators indicate room for upward expansion toward the projected target zone.
                      </p>
                    </div>

                    {/* Algorithm Scan Rationale */}
                    <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2">
                      <div className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                        <Crosshair className="w-3.5 h-3.5 text-amber-400" />
                        Algorithmic Setup Rationale
                      </div>
                      {renderFormattedPoints(selectedStock.reason || "Momentum breakout and structural swing confirmation under the quantitative short term swing framework.", "amber")}
                    </div>
                  </div>
                </div>

                {/* 4. Closing Details (if Closed) */}
                {(selectedStock.exitReason || selectedStock.exitDate) && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-1.5 text-xs">
                    <div className="font-bold text-rose-400 flex items-center gap-1.5 text-xs uppercase tracking-wide">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Closing Information
                    </div>
                    {selectedStock.exitReason && (
                      <div className="text-white/80">
                        <span className="font-semibold text-rose-300">Closing Reason:</span> {selectedStock.exitReason}
                      </div>
                    )}
                    {selectedStock.exitDate && (
                      <div className="text-white/70 font-mono text-[11px]">
                        <span className="font-semibold text-rose-300">Closing Date:</span> {selectedStock.exitDate}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Button: Close Modal without leaving page */}
              <div className="pt-2">
                <Button
                  onClick={() => setSelectedStock(null)}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-black text-xs rounded-xl h-10 shadow-lg shadow-amber-500/20"
                >
                  Close Analysis
                </Button>
              </div>

              {/* SEBI RA Disclaimer Footer */}
              <div className="pt-2 text-[10px] text-muted-foreground/60 text-center leading-relaxed">
                LASA Research Services · SEBI Registered Research Analyst INH0000XXXXX · Investments in securities are subject to market risks.
              </div>
            </div>
          );
        })()}
      </DialogContent>
      </Dialog>
    </div>
  );
}

export default ExitTargetScreener;
