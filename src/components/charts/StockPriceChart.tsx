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

const StockPriceChart = ({ data = [], onHover }: StockPriceChartProps) => {
  const [localHovered, setLocalHovered] = useState<HoveredData | null>(null);

  const chartData = useMemo(() => {
    const mlValues = data.map(d => d.mlFutPrice20d);
    return data.map((d, i) => {
      const { wolfeD: rawWolfe, projFvg: rawProjFvg, ...rest } = d;
      const result: any = {
        ...rest,
        model: calculateRollingMedian(mlValues, i, 10),
      };
      if (rawWolfe && rawWolfe !== 0) {
        result.wolfeD = rawWolfe;
      }
      if (rawProjFvg && rawProjFvg !== 0) {
        result.projFvg = rawProjFvg;
      }
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
      const payload = state.activePayload;
      const hoveredData: HoveredData = {
        date: payload[0]?.payload?.date || '',
        price: payload.find((p: any) => p.dataKey === 'price')?.value ?? null,
        support: payload.find((p: any) => p.dataKey === 'support')?.value ?? null,
        resistance: payload.find((p: any) => p.dataKey === 'resistance')?.value ?? null,
        model: payload.find((p: any) => p.dataKey === 'model')?.value ?? null,
        pattern: payload.find((p: any) => p.dataKey === 'wolfeD')?.value ?? null,
        projFvg: payload.find((p: any) => p.dataKey === 'projFvg')?.value ?? null,
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
      const payload = state.activePayload;
      const hoveredData: HoveredData = {
        date: payload[0]?.payload?.date || '',
        price: payload.find((p: any) => p.dataKey === 'price')?.value ?? null,
        support: payload.find((p: any) => p.dataKey === 'support')?.value ?? null,
        resistance: payload.find((p: any) => p.dataKey === 'resistance')?.value ?? null,
        model: payload.find((p: any) => p.dataKey === 'model')?.value ?? null,
        pattern: payload.find((p: any) => p.dataKey === 'wolfeD')?.value ?? null,
        projFvg: payload.find((p: any) => p.dataKey === 'projFvg')?.value ?? null,
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
              interval="preserveStartEnd"
              minTickGap={30}
            />
            
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              domain={yDomain as [number, number]}
              dx={-10}
              width={60}
              tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}
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

            <Line
              type="monotone"
              dataKey="price"
              stroke="hsl(var(--chart-primary))"
              strokeWidth={3}
              dot={<CustomDot />}
              activeDot={{ 
                r: 6, 
                fill: 'hsl(var(--chart-primary))',
                stroke: 'hsl(var(--background))',
                strokeWidth: 2
              }}
            />

            <Line
              type="monotone"
              dataKey="support"
              name="Support"
              stroke="#ef4444"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="3 3"
            />

            <Line
              type="monotone"
              dataKey="resistance"
              name="Resistance"
              stroke="#22c55e"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="3 3"
            />

            <Line
              type="monotone"
              dataKey="model"
              name="Model"
              stroke="#f59e0b"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="3 3"
              connectNulls
            />

            <Line
              type="monotone"
              dataKey="wolfeD"
              name="Pattern"
              stroke="#8b5cf6"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="3 3"
            />

            <Line
              type="monotone"
              dataKey="projFvg"
              name="Balance"
              stroke="#ec4899"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="3 3"
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StockPriceChart;
