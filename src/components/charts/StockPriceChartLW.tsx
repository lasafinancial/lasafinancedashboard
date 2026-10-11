import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createChart,
  AreaSeries,
  LineSeries,
  LineStyle,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
  type Time,
} from "lightweight-charts";
import { buildPriceChartData } from "./StockPriceChart";

interface HoveredData {
  date: string;
  price: number | null;
  support: number | null;
  resistance: number | null;
  model: number | null;
  pattern: number | null;
  projFvg: number | null;
}

interface StockPriceChartLWProps {
  data?: any[];
  onHover?: (data: HoveredData | null) => void;
  symbol?: string;
}

// The history's dates are labels without a year ("31st Jul", "9th Oct (LIVE)"), so each point
// is placed by its index (one day apart) and the axis shows the original label.
const BASE_TIME = Date.UTC(2000, 0, 1) / 1000;
const DAY = 86400;
const toTime = (i: number) => (BASE_TIME + i * DAY) as UTCTimestamp;
const toIndex = (t: Time) => Math.round(((t as number) - BASE_TIME) / DAY);

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v !== 0;

/** Turns "hsl(var(--chart-primary))" into a colour the canvas can use. */
function cssHsl(varName: string, fallback: string, alpha = 1) {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  if (!v) return fallback;
  const parts = v.replace(/,/g, " ").split(/\s+/).filter(Boolean);
  if (parts.length < 3) return fallback;
  return `hsla(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`;
}

const LEGEND = [
  { key: "price", label: "Price", swatch: "bg-chart-primary", text: "text-cyan-400" },
  { key: "support", label: "Support", swatch: "bg-[#ef4444]", text: "text-[#ef4444]" },
  { key: "resistance", label: "Resistance", swatch: "bg-[#22c55e]", text: "text-[#22c55e]" },
  { key: "model", label: "Model", swatch: "bg-[#f59e0b]", text: "text-[#f59e0b]" },
  { key: "pattern", label: "Pattern", swatch: "bg-[#8b5cf6]", text: "text-[#8b5cf6]" },
  { key: "projFvg", label: "Balance", swatch: "bg-[#ec4899]", text: "text-[#ec4899]" },
] as const;

const StockPriceChartLW = ({ data = [], onHover, symbol }: StockPriceChartLWProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [hovered, setHoveredState] = useState<HoveredData | null>(null);
  const onHoverRef = useRef(onHover);
  onHoverRef.current = onHover;
  const setHovered = useCallback((h: HoveredData | null) => {
    setHoveredState(h);
    onHoverRef.current?.(h);
  }, []);

  const chartData = useMemo(() => buildPriceChartData(data), [data]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || chartData.length === 0) return;

    const primary = cssHsl("--chart-primary", "#22d3ee");
    const muted = cssHsl("--muted-foreground", "#94a3b8");
    const grid = cssHsl("--border", "rgba(255,255,255,0.08)", 0.3);

    const chart = createChart(el, {
      autoSize: true,
      layout: {
        background: { color: "transparent" },
        textColor: muted,
        fontSize: 10,
        attributionLogo: true,
      },
      grid: { vertLines: { visible: false }, horzLines: { color: grid, style: LineStyle.Dashed } },
      rightPriceScale: { borderVisible: false, scaleMargins: { top: 0.1, bottom: 0.1 } },
      timeScale: {
        borderVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
        tickMarkFormatter: (t: Time) => {
          const label = chartData[toIndex(t)]?.date ?? "";
          return String(label).replace(/\s*\(LIVE\)/i, "");
        },
      },
      localization: {
        timeFormatter: (t: Time) => String(chartData[toIndex(t)]?.date ?? ""),
        priceFormatter: (p: number) => p.toLocaleString(undefined, { maximumFractionDigits: 2 }),
      },
      crosshair: {
        mode: CrosshairMode.Magnet,
        vertLine: { color: muted, style: LineStyle.Dashed, labelBackgroundColor: "#0e7490" },
        horzLine: { color: muted, style: LineStyle.Dashed, labelBackgroundColor: "#0e7490" },
      },
      handleScroll: { vertTouchDrag: false },
    });
    chartRef.current = chart;

    // One point per index; null values become gaps (whitespace points)
    const points = (key: string) =>
      chartData.map((d: any, i: number) => (isNum(d[key]) ? { time: toTime(i), value: d[key] } : { time: toTime(i) }));
    // For lines drawn with connectNulls in the old chart: skip nulls instead of leaving gaps
    const connected = (key: string) =>
      chartData.flatMap((d: any, i: number) => (isNum(d[key]) ? [{ time: toTime(i), value: d[key] }] : []));

    const line = (color: string, style: LineStyle = LineStyle.Solid, width: 1 | 2 | 3 = 2) =>
      chart.addSeries(LineSeries, {
        color,
        lineWidth: width,
        lineStyle: style,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });

    // Support / resistance (historical solid, live dashed)
    line("#ff4d4d").setData(connected("supportHist"));
    line("#ff4d4d", LineStyle.Dashed).setData(connected("supportLive"));
    line("#00ff88").setData(connected("resistanceHist"));
    line("#00ff88", LineStyle.Dashed).setData(connected("resistanceLive"));

    // Model, pattern and balance (dotted)
    line("#fbbf24", LineStyle.Dotted).setData(connected("model"));
    line("#a855f7", LineStyle.Dotted).setData(connected("wolfeD"));
    const balance: ISeriesApi<"Line"> = chart.addSeries(LineSeries, {
      color: "#f472b6",
      lineWidth: 2,
      lineStyle: LineStyle.Dotted,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
      pointMarkersVisible: true,
      pointMarkersRadius: 2,
    });
    balance.setData(points("projFvg"));

    // Price: area for history, dashed line for the live segment
    const price = chart.addSeries(AreaSeries, {
      lineColor: primary,
      lineWidth: 3,
      topColor: cssHsl("--chart-primary", "rgba(34,211,238,0.3)", 0.3),
      bottomColor: cssHsl("--chart-primary", "rgba(34,211,238,0)", 0),
      priceLineVisible: false,
      lastValueVisible: true,
      crosshairMarkerRadius: 5,
      crosshairMarkerBorderColor: "#0b1220",
      crosshairMarkerBackgroundColor: primary,
    });
    price.setData(points("priceHist"));
    line(primary, LineStyle.Dashed, 3).setData(connected("priceLive"));

    chart.timeScale().fitContent();

    chart.subscribeCrosshairMove((param) => {
      if (param.time === undefined || !param.point) {
        setHovered(null);
        return;
      }
      const p: any = chartData[toIndex(param.time)];
      if (!p) return setHovered(null);
      setHovered({
        date: p.date || "",
        price: p.price ?? null,
        support: p.support ?? null,
        resistance: p.resistance ?? null,
        model: p.model ?? null,
        pattern: p.wolfeD ?? null,
        projFvg: p.projFvg ?? null,
      });
    });

    return () => {
      chart.remove();
      chartRef.current = null;
    };
  }, [chartData, setHovered]);

  const values = (
    <>
      {LEGEND.map((l) => (
        <div key={l.key} className="flex items-center gap-1.5">
          <div className={`w-3 h-0.5 ${l.swatch} rounded`} />
          <span className="text-muted-foreground">{l.label}</span>
          {hovered && (
            <span className={`font-mono font-semibold ${l.text}`}>
              {(hovered[l.key] as number | null)?.toLocaleString() ?? "-"}
            </span>
          )}
        </div>
      ))}
    </>
  );

  const dateChip = hovered && (
    <div className="flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
      {symbol && (
        <>
          <span className="font-mono font-bold text-primary">{symbol}</span>
          <div className="w-px h-3 bg-primary/30 mx-1" />
        </>
      )}
      <span className="text-muted-foreground uppercase tracking-widest text-[10px] font-bold">Date</span>
      <span className="font-mono font-bold text-cyan-400">{hovered.date}</span>
    </div>
  );

  return (
    <div className="glass-card p-6 animate-fade-in-up">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Price Movement</h3>
          <div className="hidden md:flex items-center gap-4 text-xs">
            {dateChip && <div className="mr-4">{dateChip}</div>}
            {values}
          </div>
        </div>
        <div className="md:hidden flex flex-col gap-3">
          {dateChip && <div className="flex items-center gap-2 pb-2 border-b border-border/50">{dateChip}</div>}
          <div className="flex items-center gap-3 text-xs flex-wrap">{values}</div>
        </div>
      </div>

      <div ref={containerRef} className="h-[300px] relative" onMouseLeave={() => setHovered(null)} />
    </div>
  );
};

export default StockPriceChartLW;
