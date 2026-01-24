"use client";

import { useState, useCallback } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis, Legend, Tooltip, ReferenceLine } from "recharts";
import {
  ChartConfig,
  ChartContainer,
} from "@/components/ui/line-chart";
import { BrainCircuit } from "lucide-react";

interface MLStrengthMeterProps {
  data: any[];
}

const chartConfig = {
  ml_higher: {
    label: "Positive Bias Zone",
    color: "#22c55e",
  },
  ml_lower: {
    label: "Negative Bias Zone",
    color: "#ef4444",
  },
} satisfies ChartConfig;

interface HoveredData {
  date: string;
  mlHigher: number | null;
  mlLower: number | null;
}

export default function MLStrengthMeter({ data }: MLStrengthMeterProps) {
  const [hoveredData, setHoveredData] = useState<HoveredData | null>(null);

  const handleMouseMove = useCallback((state: any) => {
    if (state?.activePayload?.length) {
      const payload = state.activePayload[0]?.payload;
      setHoveredData({
        date: payload?.date || '',
        mlHigher: payload?.ml_higher ?? null,
        mlLower: payload?.ml_lower ?? null,
      });
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredData(null);
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-accent/10">
            <BrainCircuit className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Model-Derived Trend Bias</h3>
            <p className="text-xs text-muted-foreground/60 font-medium italic">Historical Pattern Analysis</p>
          </div>
        </div>
        {hoveredData ? (
          <div className="bg-card/95 backdrop-blur-sm rounded-lg border border-border/50 px-3 py-2 shadow-lg">
            <p className="text-xs text-muted-foreground mb-1">{hoveredData.date}</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
                <span className="text-xs text-muted-foreground">Positive Bias</span>
                <span className="text-sm font-semibold text-[#22c55e]">{hoveredData.mlHigher ?? '-'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#ef4444]" />
                <span className="text-xs text-muted-foreground">Negative Bias</span>
                <span className="text-sm font-semibold text-[#ef4444]">{hoveredData.mlLower ?? '-'}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
              <span className="text-muted-foreground uppercase font-bold tracking-wide">Positive Bias</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#ef4444]" />
              <span className="text-muted-foreground uppercase font-bold tracking-wide">Negative Bias</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-[300px] relative">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <LineChart
            data={data}
            margin={{
              left: 10,
              right: 20,
              top: 10,
              bottom: 20,
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <CartesianGrid 
              vertical={false} 
              strokeDasharray="4 4" 
              className="stroke-muted/20" 
            />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              minTickGap={30}
              className="text-[10px] font-medium fill-muted-foreground"
            />
            <YAxis 
              tick={{ fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              className="text-[10px] fill-muted-foreground"
            />
            <Tooltip 
              content={() => null}
              cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <ReferenceLine 
              y={60} 
              stroke="#fbbf24" 
              strokeDasharray="5 5" 
              strokeOpacity={1} 
              strokeWidth={2}
              isFront={true}
              label={{ 
                value: 'Threshold: 60', 
                position: 'insideTopRight', 
                fontSize: 11, 
                fontWeight: 'bold',
                fill: '#fbbf24',
                className: "drop-shadow-sm"
              }} 
            />
            <Line
              dataKey="ml_higher"
              name="ml_higher"
              type="monotone"
              stroke="var(--color-ml_higher)"
              dot={{ r: 3, fill: "var(--color-ml_higher)", strokeWidth: 0 }}
              strokeWidth={3}
              filter="url(#glow-ml)"
            />
            <Line
              dataKey="ml_lower"
              name="ml_lower"
              type="monotone"
              stroke="var(--color-ml_lower)"
              dot={{ r: 3, fill: "var(--color-ml_lower)", strokeWidth: 0 }}
              strokeWidth={3}
              filter="url(#glow-ml)"
            />
            <defs>
              <filter id="glow-ml" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
          </LineChart>
        </ChartContainer>
      </div>

      <div className="mt-6 p-4 rounded-lg bg-card/50 border border-border/30">
        <h4 className="text-sm font-bold mb-2 flex items-center gap-2">
          <span className="text-base">📊</span> ML Meter – Market Bias Indicator
        </h4>
        <p className="text-xs text-muted-foreground mb-3">
          The <span className="font-semibold text-foreground">ML Meter</span> reflects the overall market's readiness for upside moves by analysing stock positioning after pullbacks and extensions.
        </p>
        <ul className="text-xs text-muted-foreground space-y-2 mb-3">
          <li>
            <span className="font-semibold text-foreground">• Above 60:</span> Majority of stocks have cooled off after pullbacks and are better positioned for an upside swing. Long setups generally offer better risk-reward.
          </li>
          <li>
            <span className="font-semibold text-foreground">• 50–60:</span> Mixed conditions. Selective trading is advised with strict risk control.
          </li>
          <li>
            <span className="font-semibold text-foreground">• Below 50:</span> Most stocks are extended. Upside may be limited and traders should be cautious with long positions.
          </li>
        </ul>
        <p className="text-[10px] text-muted-foreground italic">
          The ML Meter is a probability-based market indicator and not a buy/sell signal.
        </p>
      </div>
    </div>
  );
}
