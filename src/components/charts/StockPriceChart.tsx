import { useMemo, useState, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart, Dot } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

interface HoveredData {
  date: string;
  price: number | null;
  support: number | null;
  resistance: number | null;
  model: number | null;
  pattern: number | null;
  projFvg: number | null;
}

interface StockPriceChartProps {
  data?: any[];
  onHover?: (data: HoveredData | null) => void;
  symbol?: string;
}

const CustomDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (!payload || payload.resistanceSlopeDownward === undefined) return null;

  const isDownward = String(payload.resistanceSlopeDownward).toLowerCase() === 'true';

  return (
    <g transform={`translate(${cx - 6}, ${cy - 6})`}>
      {isDownward ? (
        <path d="M12 17V7M12 17L7 12M12 17L17 12" stroke="#ef4444" strokeWidth="2" fill="none" />
      ) : (
        <path d="M12 7V17M12 7L7 12M12 7L17 12" stroke="#22c55e" strokeWidth="2" fill="none" />
      )}
    </g>
  );
};

const calculateRollingMedian = (values: number[], index: number, windowSize: number): number | null => {
  const start = Math.max(0, index - windowSize + 1);
  const window = values.slice(start, index + 1).filter(v => v != null && !isNaN(v));
  if (window.length === 0) return null;
  const sorted = [...window].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const StockPriceChart = ({ data = [], onHover, symbol }: StockPriceChartProps) => {
  const [localHovered, setLocalHovered] = useState<HoveredData | null>(null);

  const chartData = useMemo(() => {
    const mlValues = data.map(d => d.mlFutPrice20d);
    let lastWolfeD: number | null = null;
    let activeProjFvg: number | null = null;
    let lastSeenProjFvg: number | null = null;
    let previousPrice: number | null = null;

    return data.map((d, i) => {
      const { wolfeD: rawWolfe, projFvg: rawProjFvg, ...rest } = d;

      if (rawWolfe && rawWolfe !== 0) {
        lastWolfeD = rawWolfe;
      }
      
      if (rawProjFvg && rawProjFvg !== 0 && rawProjFvg !== lastSeenProjFvg) {
        activeProjFvg = rawProjFvg;
        lastSeenProjFvg = rawProjFvg;
      }

      let currentProjFvg = activeProjFvg;
      if (activeProjFvg !== null) {
        const price = d.price;
        if (price != null) {
          const target = activeProjFvg;
          const withinRange = price >= target * 0.99 && price <= target * 1.01;
          
          let crossed = false;
          if (previousPrice != null) {
             if (previousPrice < target && price > target) crossed = true;
             if (previousPrice > target && price < target) crossed = true;
          }

          if (withinRange || crossed) {
            activeProjFvg = null;
            // Keep the stop-point visible; subsequent points stay null
            currentProjFvg = target;
          }
        }
      }
      
      if (d.price != null) {
        previousPrice = d.price;
      }

      const isLive = !!d.isLive;
      const isLastHistorical = !isLive && (i === data.length - 2 && !!data[data.length - 1]?.isLive);

      const result: any = {
        ...rest,
        isLive,
        model: isLive ? null : calculateRollingMedian(mlValues, i, 10),
        wolfeD: isLive ? null : lastWolfeD,
        projFvg: isLive ? null : currentProjFvg,
        // Segmented keys for rendering - explicitly nulling to prevent overlap
        priceHist: !isLive ? d.price : null,
        priceLive: (isLive || isLastHistorical) ? d.price : null,
        supportHist: !isLive ? d.support : null,
        supportLive: (isLive || isLastHistorical) ? d.support : null,
        resistanceHist: !isLive ? d.resistance : null,
        resistanceLive: (isLive || isLastHistorical) ? d.resistance : null,
      };
      return result;
    });
  }, [data]);

  const yDomain = useMemo(() => {
    if (!chartData.length) return ['auto', 'auto'];
    const prices = chartData.map(d => d.price).filter((p): p is number => p != null && !isNaN(p));
    if (!prices.length) return ['auto', 'auto'];
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.1 || 10;
    return [Math.floor(min - padding), Math.ceil(max + padding)];
  }, [chartData]);

  const handleMouseMove = useCallback((state: any) => {
    if (state?.activePayload?.length) {
      const p = state.activePayload[0].payload;
      const hoveredData: HoveredData = {
        date: p.date || '',
        price: p.price ?? null,
        support: p.support ?? null,
        resistance: p.resistance ?? null,
        model: p.model ?? null,
        pattern: p.wolfeD ?? null,
        projFvg: p.projFvg ?? null,
      };
      setLocalHovered(hoveredData);
      onHover?.(hoveredData);
    }
  }, [onHover]);

  const handleMouseLeave = useCallback(() => {
    setLocalHovered(null);
    onHover?.(null);
  }, [onHover]);

  const handleClick = useCallback((state: any) => {
    if (state?.activePayload?.length) {
      const p = state.activePayload[0].payload;
      const hoveredData: HoveredData = {
        date: p.date || '',
        price: p.price ?? null,
        support: p.support ?? null,
        resistance: p.resistance ?? null,
        model: p.model ?? null,
        pattern: p.wolfeD ?? null,
        projFvg: p.projFvg ?? null,
      };
      setLocalHovered(hoveredData);
      onHover?.(hoveredData);
    }
  }, [onHover]);


  return (
    <div className="glass-card p-6 animate-fade-in-up">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Price Movement</h3>
          <div className="hidden md:flex items-center gap-4 text-xs">
            {localHovered && (
              <div className="flex items-center gap-2 mr-4 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
                {symbol && (
                  <>
                    <span className="font-mono font-bold text-primary">{symbol}</span>
                    <div className="w-px h-3 bg-primary/30 mx-1" />
                  </>
                )}
                <span className="text-muted-foreground uppercase tracking-widest text-[10px] font-bold">Date</span>
                <span className="font-mono font-bold text-cyan-400">{localHovered.date}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-chart-primary rounded" />
              <span className="text-muted-foreground">Price</span>
              {localHovered && <span className="font-mono font-semibold text-cyan-400">{localHovered.price?.toLocaleString() ?? '-'}</span>}
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-[#ef4444] rounded" />
              <span className="text-muted-foreground">Support</span>
              {localHovered && <span className="font-mono font-semibold text-[#ef4444]">{localHovered.support?.toLocaleString() ?? '-'}</span>}
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-[#22c55e] rounded" />
              <span className="text-muted-foreground">Resistance</span>
              {localHovered && <span className="font-mono font-semibold text-[#22c55e]">{localHovered.resistance?.toLocaleString() ?? '-'}</span>}
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-[#f59e0b] rounded" />
              <span className="text-muted-foreground">Model</span>
              {localHovered && <span className="font-mono font-semibold text-[#f59e0b]">{localHovered.model?.toLocaleString() ?? '-'}</span>}
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-[#8b5cf6] rounded" />
              <span className="text-muted-foreground">Pattern</span>
              {localHovered && <span className="font-mono font-semibold text-[#8b5cf6]">{localHovered.pattern?.toLocaleString() ?? '-'}</span>}
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-[#ec4899] rounded" />
              <span className="text-muted-foreground">Balance</span>
              {localHovered && <span className="font-mono font-semibold text-[#ec4899]">{localHovered.projFvg?.toLocaleString() ?? '-'}</span>}
            </div>
          </div>
        </div>

        <div className="md:hidden flex flex-col gap-3">
          {localHovered && (
            <div className="flex items-center gap-2 pb-2 border-b border-border/50">
              <div className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full flex items-center gap-2">
                {symbol && (
                  <>
                    <span className="font-mono font-bold text-primary">{symbol}</span>
                    <div className="w-px h-3 bg-primary/30 mx-1" />
                  </>
                )}
                <span className="text-muted-foreground uppercase tracking-widest text-[10px] font-bold">Date</span>
                <span className="font-mono font-bold text-cyan-400">{localHovered.date}</span>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 text-xs flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-chart-primary rounded" />
              <span className="text-muted-foreground">Price</span>
              {localHovered && <span className="font-mono font-semibold text-cyan-400">{localHovered.price?.toLocaleString() ?? '-'}</span>}
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-[#ef4444] rounded" />
              <span className="text-muted-foreground">Support</span>
              {localHovered && <span className="font-mono font-semibold text-[#ef4444]">{localHovered.support?.toLocaleString() ?? '-'}</span>}
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-[#22c55e] rounded" />
              <span className="text-muted-foreground">Resistance</span>
              {localHovered && <span className="font-mono font-semibold text-[#22c55e]">{localHovered.resistance?.toLocaleString() ?? '-'}</span>}
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-[#f59e0b] rounded" />
              <span className="text-muted-foreground">Model</span>
              {localHovered && <span className="font-mono font-semibold text-[#f59e0b]">{localHovered.model?.toLocaleString() ?? '-'}</span>}
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-[#8b5cf6] rounded" />
              <span className="text-muted-foreground">Pattern</span>
              {localHovered && <span className="font-mono font-semibold text-[#8b5cf6]">{localHovered.pattern?.toLocaleString() ?? '-'}</span>}
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-[#ec4899] rounded" />
              <span className="text-muted-foreground">Balance</span>
              {localHovered && <span className="font-mono font-semibold text-[#ec4899]">{localHovered.projFvg?.toLocaleString() ?? '-'}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="h-[300px] chart-container relative">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
          >
            <defs>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--chart-primary))" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(var(--chart-primary))" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              opacity={0.3}
              vertical={false}
            />

            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              dy={10}
              interval="preserveEnd"
              minTickGap={5}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              domain={yDomain as [number, number]}
              dx={-10}
              width={60}
              tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
            />

            <Tooltip
              content={<></>}
              cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '4 4' }}
            />

            <Area
              type="monotone"
              dataKey="price"
              stroke="transparent"
              fill="url(#priceGradient)"
            />

            {/* Solid Historical Price Line */}
            <Line
              type="monotone"
              dataKey="priceHist"
              name="Price"
              stroke="hsl(var(--chart-primary))"
              strokeWidth={3}
              dot={<CustomDot />}
              filter="url(#glow)"
              activeDot={{
                r: 6,
                fill: 'hsl(var(--chart-primary))',
                stroke: 'hsl(var(--background))',
                strokeWidth: 2
              }}
              connectNulls
            />

            {/* Dotted Live Extension */}
            <Line
              type="monotone"
              dataKey="priceLive"
              name="Live"
              stroke="hsl(var(--chart-primary))"
              strokeWidth={3}
              strokeDasharray="10 6"
              dot={({ cx, cy, index }) => {
                // Only show a dot for the very last point in the chart data
                if (index === chartData.length - 1) {
                  return (
                    <circle
                      key={`live-dot-${index}`}
                      cx={cx}
                      cy={cy}
                      r={4}
                      fill="white"
                      stroke="hsl(var(--chart-primary))"
                      strokeWidth={2}
                    />
                  );
                }
                return null;
              }}
              activeDot={{
                r: 6,
                fill: 'white',
                stroke: 'hsl(var(--chart-primary))',
                strokeWidth: 2
              }}
              animationDuration={500}
              connectNulls
            />

            <Line
              type="monotone"
              dataKey="supportHist"
              name="Support"
              stroke="#ff4d4d"
              strokeWidth={2}
              dot={false}
              filter="url(#glow)"
              connectNulls
            />

            <Line
              type="monotone"
              dataKey="supportLive"
              name="Live (Support)"
              stroke="#ff4d4d"
              strokeWidth={2}
              strokeDasharray="8 5"
              dot={false}
              connectNulls
            />

            <Line
              type="monotone"
              dataKey="resistanceHist"
              name="Resistance"
              stroke="#00ff88"
              strokeWidth={2}
              dot={false}
              filter="url(#glow)"
              connectNulls
            />

            <Line
              type="monotone"
              dataKey="resistanceLive"
              name="Live (Resistance)"
              stroke="#00ff88"
              strokeWidth={2}
              strokeDasharray="8 5"
              dot={false}
              connectNulls
            />

            <Line
              type="monotone"
              dataKey="model"
              name="Model"
              stroke="#fbbf24"
              strokeWidth={2}
              dot={false}
              strokeDasharray="3 3"
              filter="url(#glow)"
              connectNulls
            />

            <Line
              type="monotone"
              dataKey="wolfeD"
              name="Pattern"
              stroke="#a855f7"
              strokeWidth={2}
              dot={false}
              strokeDasharray="3 3"
              filter="url(#glow)"
              connectNulls
            />

            <Line
              type="monotone"
              dataKey="projFvg"
              name="Balance"
              stroke="#f472b6"
              strokeWidth={2}
              dot={false}
              strokeDasharray="3 3"
              filter="url(#glow)"
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StockPriceChart;
