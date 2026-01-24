"use client";

import { CartesianGrid, XAxis, YAxis, Tooltip, ReferenceLine, ComposedChart, Line, Area } from "recharts";
import {
  ChartConfig,
  ChartContainer,
} from "@/components/ui/line-chart";
import { Scale, TrendingUp, TrendingDown, Minus, Info, AlertTriangle, CheckCircle } from "lucide-react";
import { useMemo } from "react";

interface MarketBalanceIndicatorProps {
  data: any[];
}

const chartConfig = {
  fg_above: {
    label: "Balance Above",
    color: "#22c55e",
  },
  fg_below: {
    label: "Balance Below",
    color: "#ef4444",
  },
} satisfies ChartConfig;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const fgAbove = payload.find((p: any) => p.dataKey === 'fg_above')?.value || 0;
    const fgBelow = payload.find((p: any) => p.dataKey === 'fg_below')?.value || 0;
    const fgNet = fgAbove - fgBelow;
    
    return (
      <div className="bg-background/95 border border-border/50 rounded-lg p-2.5 shadow-lg backdrop-blur-sm">
        <p className="text-[10px] text-muted-foreground mb-1.5 font-medium">{label}</p>
        <div className="space-y-0.5 text-xs">
          <p className="font-semibold text-success">Above: {fgAbove}</p>
          <p className="font-semibold text-destructive">Below: {fgBelow}</p>
          <p className={`font-bold pt-1 border-t border-border/30 ${fgNet >= 0 ? 'text-cyan-400' : 'text-orange-400'}`}>
            Net: {fgNet > 0 ? '+' : ''}{fgNet}
          </p>
        </div>
      </div>
    );
  }
  return null;
};

  export default function MarketBalanceIndicator({ data }: MarketBalanceIndicatorProps) {
    const chartData = useMemo(() => {
      return data.filter(item => item.date).map(item => ({
        ...item,
        fg_above: item.fg_above,
        fg_below: item.fg_below,
      }));
    }, [data]);

    const latest = chartData[chartData.length - 1];
    const fgAbove = latest?.fg_above || 0;
    const fgBelow = latest?.fg_below || 0;
    const fgNet = fgAbove - fgBelow;
    
    const isBullish = fgAbove > 20;
    const isBearish = fgBelow > fgAbove;
    const verdict = isBullish ? "BULLISH" : isBearish ? "BEARISH" : "NEUTRAL";
  const verdictColor = verdict === "BULLISH" ? "text-success" : verdict === "BEARISH" ? "text-destructive" : "text-warning";
  const VerdictIcon = verdict === "BULLISH" ? TrendingUp : verdict === "BEARISH" ? TrendingDown : Minus;

  return (
      <div className="flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-cyan-500/10">
                <Scale className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Market Balance</h3>
                <p className="text-xs text-muted-foreground/60 font-medium italic">Price Acceptance</p>
              </div>
            </div>
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold tracking-wide bg-white/5 border border-white/10 ${verdictColor}`}>
            <VerdictIcon className="w-3 h-3" />
            {verdict}
          </div>
        </div>

          <div className="flex flex-col gap-4">
            <div className="w-full">
              <div className="h-[160px] max-sm:h-[140px] lg:h-[220px] w-full">
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <ComposedChart
                    data={chartData}
                    margin={{ left: -25, right: 5, top: 5, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="greenAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="redAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid 
                      vertical={false} 
                      strokeDasharray="3 3" 
                      className="stroke-muted/10" 
                    />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={4}
                      minTickGap={60}
                      tick={{ fontSize: 8 }}
                      className="fill-muted-foreground/70"
                    />
                    <YAxis 
                      tick={{ fontSize: 8 }}
                      axisLine={false}
                      tickLine={false}
                      width={25}
                      className="fill-muted-foreground/70"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" strokeOpacity={0.2} />
                      <ReferenceLine y={15} stroke="#fbbf24" strokeDasharray="5 5" strokeOpacity={0.6} label={{ value: 'Threshold: 15', position: 'insideTopRight', fontSize: 9, fill: '#fbbf24' }} />
                    
                    <Area
                      type="monotone"
                      dataKey="fg_above"
                      stroke="transparent"
                      fill="url(#greenAreaGradient)"
                    />
                    <Area
                      type="monotone"
                      dataKey="fg_below"
                      stroke="transparent"
                      fill="url(#redAreaGradient)"
                    />
                    <Line
                      type="monotone"
                      dataKey="fg_above"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: "#22c55e", stroke: "#fff", strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="fg_below"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: "#ef4444", stroke: "#fff", strokeWidth: 2 }}
                    />
                  </ComposedChart>
                </ChartContainer>
              </div>
              
              <div className="flex items-center justify-center gap-4 mt-2 text-[9px]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm bg-success/80"></div>
                    <span className="text-muted-foreground/80">Above</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm bg-destructive/80"></div>
                    <span className="text-muted-foreground/80">Below</span>
                  </div>
                </div>
                
<div className="mt-3 p-2.5 rounded-lg bg-muted/5 border border-muted/10">
                    <p className="text-[11px] max-sm:text-[10px] text-muted-foreground/70 leading-relaxed mb-2">
                      <span className="font-semibold text-muted-foreground/90">Market Balance</span> shows where the market is accepting prices by tracking how many stocks are finding balance at <span className="font-semibold text-white/90">higher levels</span> versus <span className="font-semibold text-white/90">lower levels</span>.
                    </p>
                    <ul className="text-[11px] max-sm:text-[10px] text-muted-foreground/70 leading-relaxed space-y-2">
                      <li>
                        <span className="font-semibold text-success">Balance Above &gt; 20:</span> Historically, when a higher number of stocks find balance at <span className="font-semibold text-white/80">higher prices</span>, it signals strong acceptance by the market. The probability of <span className="text-success">upside continuation is higher than downside</span>, making long positions a favourable approach.
                      </li>
                      <li>
                        <span className="font-semibold text-destructive">Balance Below &gt; Balance Above:</span> When more stocks find balance at <span className="font-semibold text-white/80">lower prices</span>, it indicates weakening acceptance at higher levels. Traders are advised to stay cautious, as the market may <span className="font-semibold text-white/80">correct or experience a pullback</span>.
                      </li>
                    </ul>
                    <p className="text-[10px] max-sm:text-[9px] text-muted-foreground/50 leading-relaxed mt-2 italic border-l-2 border-muted/30 pl-2">
                      Market Balance reflects price acceptance behaviour and should be used alongside trend and risk indicators.
                    </p>
                  </div>
              </div>

            <div className="w-full flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3 max-sm:gap-2">
                <div className="p-3 max-sm:p-2 rounded-lg bg-success/5 border border-success/20 text-center">
                  <div className="text-[10px] max-sm:text-[9px] font-bold text-success/70 uppercase mb-1">Above</div>
                  <div className="text-2xl max-sm:text-xl font-black text-success">{fgAbove}</div>
                </div>
                <div className="p-3 max-sm:p-2 rounded-lg bg-destructive/5 border border-destructive/20 text-center">
                  <div className="text-[10px] max-sm:text-[9px] font-bold text-destructive/70 uppercase mb-1">Below</div>
                  <div className="text-2xl max-sm:text-xl font-black text-destructive">{fgBelow}</div>
                </div>
              </div>
              


              <div className={`p-3 max-sm:p-2 rounded-lg ${isBullish ? 'bg-success/5 border-success/20' : isBearish ? 'bg-destructive/5 border-destructive/20' : 'bg-warning/5 border-warning/20'} border`}>
                {isBullish ? (
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <p className="text-success/90 text-xs max-sm:text-[11px] leading-relaxed">
                      <span className="font-bold">Bullish:</span> Strong acceptance at higher prices. Upside likely.
                    </p>
                  </div>
                ) : isBearish ? (
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                    <p className="text-destructive/90 text-xs max-sm:text-[11px] leading-relaxed">
                      <span className="font-bold">Caution:</span> Weakening acceptance. Possible pullback ahead.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <Minus className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                    <p className="text-warning/90 text-xs max-sm:text-[11px] leading-relaxed">
                      <span className="font-bold">Neutral:</span> Mixed signals. Wait for clearer direction.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-2 px-1">
                <Info className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0 mt-0.5" />
                <p className="text-muted-foreground/60 text-[10px] leading-relaxed">
                  Tracks stock balance at relative price levels.
                </p>
              </div>
            </div>
          </div>
      </div>
  );
}
