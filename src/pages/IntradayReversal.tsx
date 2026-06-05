import { useState, useMemo } from "react";
import {
  Search,
  ArrowUpRight,
  Loader2,
  Sparkles,
  AlertCircle,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Info,
  Clock,
  Download,
  Activity,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
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

type SortField =
  | "symbol"
  | "reversalDetectedAt"
  | "breakoutTime"
  | "breakoutPrice"
  | "haClose"
  | "dropFromHigh"
  | "candlesSinceBreakout";
type SortDirection = "asc" | "desc";

export function IntradayReversal() {
  const navigate = useNavigate();
  const { intradayReversal: stocks, isLoading, stockData, lastUpdate } = useLiveData();
  const { isFree } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("reversalDetectedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const formatNumber = (num: number) => {
    if (num === null || num === undefined || num === 0) return "—";
    return new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(num);
  };

  const formatPercent = (num: number) => {
    if (num === null || num === undefined) return "—";
    return `${num.toFixed(2)}%`;
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="w-3 h-3 ml-1 inline-block" />
    ) : (
      <ChevronDown className="w-3 h-3 ml-1 inline-block" />
    );
  };

  // Filter to only today's data for the stat counter
  const todayStr = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  })();

  const processedStocks = useMemo(() => {
    if (!stocks) return [];
    let data = [...stocks];

    if (searchTerm) {
      data = data.filter((stock) =>
        stock.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    data.sort((a, b) => {
      const valA = (a as any)[sortField];
      const valB = (b as any)[sortField];

      if (typeof valA === "number" && typeof valB === "number") {
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }

      const strA = String(valA || "").toLowerCase();
      const strB = String(valB || "").toLowerCase();
      if (strA < strB) return sortDirection === "asc" ? -1 : 1;
      if (strA > strB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return data;
  }, [stocks, searchTerm, sortField, sortDirection]);

  const todayCount = useMemo(() => {
    if (!stocks) return 0;
    return stocks.filter((s) => s.date && s.date.includes(todayStr)).length;
  }, [stocks, todayStr]);

  const handleStockClick = (symbol: string) => {
    navigate(`/stocks?symbol=${symbol}`);
  };

  const handleExport = () => {
    if (!processedStocks.length) return;
    const headers = [
      "Symbol",
      "Reversal Detected At",
      "Breakout Time",
      "Breakout Price",
      "HA Close",
      "% Drop from High",
      "Candles since Breakout",
    ];
    const rows = processedStocks.map((s) => [
      s.symbol,
      s.reversalDetectedAt,
      s.breakoutTime,
      s.breakoutPrice,
      s.haClose,
      s.dropFromHigh,
      s.candlesSinceBreakout,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `intraday-reversal-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const thClass =
    "text-[11px] font-black text-white/60 uppercase tracking-widest cursor-pointer hover:text-white transition-colors select-none";

  return (
    <div className="min-h-screen bg-[#020617] text-foreground selection:bg-primary/30">
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-500/10 rounded-full blur-[130px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-500/10 rounded-full blur-[130px] animate-pulse delay-700" />
        <div className="absolute top-[40%] right-[30%] w-[25%] h-[25%] bg-primary/5 rounded-full blur-[100px] animate-pulse delay-1000" />
      </div>

      <div className="relative container mx-auto px-4 py-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold uppercase tracking-wider w-fit">
                <Activity className="w-3 h-3" />
                Screener: Intraday
              </div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">
                  Intraday{" "}
                  <span className="bg-gradient-to-r from-violet-400 to-rose-400 bg-clip-text text-transparent italic">
                    Reversal
                  </span>
                </h1>
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="p-1 rounded-full hover:bg-white/10 transition-colors text-muted-foreground hover:text-violet-400">
                      <Info className="w-5 h-5" />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl bg-[#0f172a]/95 backdrop-blur-xl border-white/10 text-white">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-rose-400 bg-clip-text text-transparent">
                        Intraday Reversal Scanner
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 text-sm text-gray-300 mt-4 leading-relaxed">
                      <p>
                        This scanner identifies stocks exhibiting intraday
                        reversal patterns — specifically those where price has
                        pulled back from breakout levels and is showing signs of
                        recovery using Heikin-Ashi candle analysis.
                      </p>
                      <div className="bg-violet-500/10 p-4 rounded-lg border border-violet-500/20">
                        <h3 className="font-semibold text-violet-300 mb-2">
                          Key Signals:
                        </h3>
                        <ul className="list-disc pl-5 space-y-1 text-gray-400">
                          <li>
                            Reversal Detected At: Timestamp when the reversal
                            pattern formed
                          </li>
                          <li>
                            HA Close: Heikin-Ashi close confirming bullish
                            reversal candle
                          </li>
                          <li>
                            % Drop from High: Depth of pullback from the
                            breakout high
                          </li>
                          <li>
                            Candles since Breakout: How recent the original
                            breakout was
                          </li>
                        </ul>
                      </div>
                      <p className="italic text-gray-400">
                        Live data refreshes automatically. Signals are derived
                        from the "intraday reversal live test" sheet.
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <p className="text-muted-foreground text-sm flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-violet-400" />
                Live pullback-to-reversal detection using Heikin-Ashi analysis.
              </p>
            </div>

            {/* Search + export */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
              <div className="relative w-full sm:w-72 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-violet-400 transition-colors" />
                <input
                  type="text"
                  placeholder="Search symbol..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/40 transition-all text-sm backdrop-blur-md"
                />
              </div>
              <button
                onClick={handleExport}
                disabled={!processedStocks.length}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-violet-500/10 hover:border-violet-500/30 text-muted-foreground hover:text-violet-300 transition-all text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stat Cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8"
        >
          {/* Reversals Today */}
          <div className="bg-white/[0.02] border border-violet-500/20 rounded-2xl p-4 backdrop-blur-sm shadow-xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-400/70 mb-1">
              Reversals Today
            </p>
            <p className="text-3xl font-black tracking-tight text-violet-300">
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin inline-block" />
              ) : (
                todayCount
              )}
            </p>
            <p className="text-[10px] text-white/30 mt-1 uppercase tracking-wider">
              Intraday signals detected
            </p>
          </div>

          {/* Total Signals */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 backdrop-blur-sm shadow-xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-1">
              Total Signals
            </p>
            <p className="text-3xl font-black tracking-tight">
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin inline-block" />
              ) : (
                processedStocks.length
              )}
            </p>
            <p className="text-[10px] text-white/30 mt-1 uppercase tracking-wider">
              Showing in table
            </p>
          </div>

          {/* Last Refresh */}
          <div className="col-span-2 md:col-span-1 bg-white/[0.02] border border-white/10 rounded-2xl p-4 backdrop-blur-sm shadow-xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-1">
              Last Refresh
            </p>
            <p className="text-xl font-black tracking-tight font-mono flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              {lastUpdate}
            </p>
            <p className="text-[10px] text-white/30 mt-1 uppercase tracking-wider">
              Auto-refreshes every 90s
            </p>
          </div>
        </motion.div>

        {/* Table Section */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <Loader2 className="h-10 w-10 text-violet-400 animate-spin" />
            <p className="mt-4 text-sm text-muted-foreground">
              Fetching reversal data...
            </p>
          </div>
        ) : processedStocks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 bg-white/[0.02] border border-dashed border-white/10 rounded-2xl"
          >
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-1">
              No reversals detected
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm
                ? `No results for "${searchTerm}". Try a different symbol.`
                : "Check back during market hours for fresh signals."}
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white/[0.01] border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm shadow-2xl"
          >
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-white/[0.03]">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead
                      onClick={() => toggleSort("symbol")}
                      className={thClass}
                    >
                      Symbol <SortIcon field="symbol" />
                    </TableHead>
                    <TableHead
                      onClick={() => toggleSort("reversalDetectedAt")}
                      className={thClass}
                    >
                      Reversal Detected At <SortIcon field="reversalDetectedAt" />
                    </TableHead>
                    <TableHead
                      onClick={() => toggleSort("breakoutTime")}
                      className={thClass}
                    >
                      Breakout Time <SortIcon field="breakoutTime" />
                    </TableHead>
                    <TableHead
                      onClick={() => toggleSort("breakoutPrice")}
                      className={`${thClass} text-right`}
                    >
                      <span className="flex items-center justify-end">
                        Breakout Price <SortIcon field="breakoutPrice" />
                      </span>
                    </TableHead>
                    <TableHead
                      onClick={() => toggleSort("haClose")}
                      className={`${thClass} text-right`}
                    >
                      <span className="flex items-center justify-end">
                        HA Close <SortIcon field="haClose" />
                      </span>
                    </TableHead>
                    <TableHead
                      onClick={() => toggleSort("dropFromHigh")}
                      className={`${thClass} text-right`}
                    >
                      <span className="flex items-center justify-end">
                        % Drop from High <SortIcon field="dropFromHigh" />
                      </span>
                    </TableHead>
                    <TableHead
                      onClick={() => toggleSort("candlesSinceBreakout")}
                      className={`${thClass} text-right`}
                    >
                      <span className="flex items-center justify-end">
                        Candles <SortIcon field="candlesSinceBreakout" />
                      </span>
                    </TableHead>
                    <TableHead className="w-[60px] text-[11px] font-black text-white/60 uppercase tracking-widest text-center">
                      View
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <PremiumProtector
                    requiredTier="pro"
                    blurLevel="md"
                    title="Premium Feature"
                    description="Upgrade to Pro to view all Intraday Reversal signals."
                  >
                    {(isFree ? processedStocks.slice(0, 8) : processedStocks).map(
                      (stock, idx) => (
                        <TableRow
                          key={`${stock.symbol}-${stock.reversalDetectedAt}-${idx}`}
                          className="border-white/5 hover:bg-white/[0.04] transition-colors group"
                        >
                          {/* Symbol */}
                          <TableCell className="py-2">
                            <span className="text-sm font-black text-white tracking-tight group-hover:text-violet-300 transition-colors">
                              {stock.symbol}
                            </span>
                          </TableCell>

                          {/* Reversal Detected At */}
                          <TableCell className="py-2">
                            <span className="text-xs text-violet-300/80 font-bold font-mono bg-violet-500/10 px-2 py-0.5 rounded-md">
                              {stock.reversalDetectedAt || "—"}
                            </span>
                          </TableCell>

                          {/* Breakout Time */}
                          <TableCell className="py-2">
                            <span className="text-[11px] text-white/50 font-mono">
                              {stock.breakoutTime || "—"}
                            </span>
                          </TableCell>

                          {/* Breakout Price */}
                          <TableCell className="py-2 text-right font-black font-mono text-sm text-white/90">
                            {stock.breakoutPrice ? `₹${formatNumber(stock.breakoutPrice)}` : "—"}
                          </TableCell>

                          {/* HA Close */}
                          <TableCell className="py-2 text-right font-bold font-mono text-xs text-emerald-400/90">
                            {stock.haClose ? `₹${formatNumber(stock.haClose)}` : "—"}
                          </TableCell>

                          {/* % Drop from High */}
                          <TableCell className="py-2 text-right font-bold font-mono text-xs">
                            <span
                              className={
                                stock.dropFromHigh < 0
                                  ? "text-rose-400"
                                  : stock.dropFromHigh > 0
                                  ? "text-emerald-400"
                                  : "text-white/50"
                              }
                            >
                              {stock.dropFromHigh
                                ? formatPercent(stock.dropFromHigh)
                                : "—"}
                            </span>
                          </TableCell>

                          {/* Candles since Breakout */}
                          <TableCell className="py-2 text-right font-bold font-mono text-xs">
                            <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-white/70">
                              {stock.candlesSinceBreakout || "—"}
                            </span>
                          </TableCell>

                          {/* Action */}
                          <TableCell className="py-2 text-center">
                            {stockData?.some(
                              (s) => s.symbol === stock.symbol
                            ) ? (
                              <button
                                onClick={() => handleStockClick(stock.symbol)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-violet-500/20 text-muted-foreground hover:text-violet-300 border border-white/5 transition-all outline-none"
                                title="View Details"
                              >
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </button>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </PremiumProtector>
                </TableBody>
              </Table>
            </div>
            {/* Footer row count */}
            <div className="px-4 py-2 border-t border-white/5 flex items-center justify-between">
              <p className="text-[11px] text-white/30 font-mono">
                {processedStocks.length} signal{processedStocks.length !== 1 ? "s" : ""} found
              </p>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                </span>
                <p className="text-[11px] text-emerald-400/60 font-mono uppercase tracking-wider">
                  Live
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default IntradayReversal;
