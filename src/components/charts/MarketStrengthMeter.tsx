"use client";

import { useState, useCallback, useMemo } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis, ReferenceLine, Tooltip } from "recharts";
import {
  ChartConfig,
  ChartContainer,
} from "@/components/ui/line-chart";
import { Activity } from "lucide-react";
import { InfoModal, InfoModalTrigger, useInfoModal } from "@/components/ui/InfoModal";

interface MarketStrengthMeterProps {
  data: any[];
}

const chartConfig = {
  rsi: {
    label: "Momentum Index",
    color: "hsl(var(--primary))",
  },
  nifty50_normalized: {
    label: "NIFTY 50",
    color: "#f97316",
  },
} satisfies ChartConfig;

interface HoveredData {
  date: string;
  rsi: number | null;
  nifty50: number | null;
}

export default function MarketStrengthMeter({ data }: MarketStrengthMeterProps) {
  const [hoveredData, setHoveredData] = useState<HoveredData | null>(null);
  const { showModal, openModal, closeModal } = useInfoModal();

  const chartData = useMemo(() => {
    const niftyValues = data.map(d => d.nifty50_close).filter(v => v > 0);
    const minNifty = Math.min(...niftyValues);
    const maxNifty = Math.max(...niftyValues);
    const range = maxNifty - minNifty || 1;
    
    return data.map(d => ({
      ...d,
      nifty50_normalized: d.nifty50_close > 0 
        ? ((d.nifty50_close - minNifty) / range) * 80 + 10
        : null,
    }));
  }, [data]);

  const handleMouseMove = useCallback((state: any) => {
    if (state?.activePayload?.length) {
      const payload = state.activePayload[0]?.payload;
      setHoveredData({
        date: payload?.date || '',
        rsi: payload?.rsi ?? null,
        nifty50: payload?.nifty50_close ?? null,
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
            <div className="p-2 rounded-lg bg-primary/10">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Momentum Oscillator</h3>
              <p className="text-xs text-muted-foreground/60 font-medium italic">Trend Strength & Exhaustion Gauge</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {hoveredData && (
              <div className="bg-card/95 backdrop-blur-sm rounded-lg border border-border/50 px-3 py-2 shadow-lg">
                <p className="text-xs text-muted-foreground mb-1">{hoveredData.date}</p>
                <p className="text-sm font-semibold text-primary">Momentum: {hoveredData.rsi ?? '-'}</p>
                {hoveredData.nifty50 && (
                  <p className="text-sm font-semibold text-orange-400">NIFTY 50: {hoveredData.nifty50.toLocaleString()}</p>
                )}
              </div>
            )}
            <InfoModalTrigger onClick={openModal} />
          </div>
      </div>

      <div className="flex-1 min-h-[300px] relative">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <LineChart
            data={chartData}
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
              domain={[0, 100]}
              tick={{ fontSize: 10 }}
              tickCount={6}
              axisLine={false}
              tickLine={false}
              label={{ value: 'Momentum Index (0-100)', angle: -90, position: 'insideLeft', offset: 10, fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip 
              content={() => null}
              cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            
            <ReferenceLine y={20} stroke="hsl(var(--muted))" strokeDasharray="3 3" />
            <ReferenceLine y={30} stroke="hsl(var(--muted))" strokeDasharray="3 3" />
            <ReferenceLine y={40} stroke="hsl(var(--muted))" strokeDasharray="3 3" />
            <ReferenceLine y={60} stroke="hsl(var(--muted))" strokeDasharray="3 3" />
            <ReferenceLine y={70} stroke="hsl(var(--muted))" strokeDasharray="3 3" />
            <ReferenceLine y={80} stroke="hsl(var(--muted))" strokeDasharray="3 3" />

            <Line
              dataKey="rsi"
              type="monotone"
              stroke="#22d3ee"
              dot={false}
              strokeWidth={2}
              name="Momentum"
            />
<Line
                dataKey="nifty50_normalized"
                type="monotone"
                stroke="#f97316"
                dot={false}
                strokeWidth={3}
                name="NIFTY 50"
              />
            <defs>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
</LineChart>
          </ChartContainer>
        </div>

        <div className="flex items-center justify-center gap-6 mt-3 text-[10px]">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 rounded-sm bg-cyan-400"></div>
            <span className="text-muted-foreground">Momentum (NIFTY 100 RSI)</span>
          </div>
<div className="flex items-center gap-2">
              <div className="w-4 h-1 rounded-sm bg-orange-500"></div>
              <span className="text-muted-foreground">NIFTY 50 (Normalized)</span>
            </div>
        </div>
        
          <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
          <div className="grid grid-cols-3 gap-2 text-[9px]">
            <div className="p-2 rounded-lg bg-success/10 border border-success/20">
              <div className="font-black text-success mb-1">Bullish Trend</div>
              <div className="text-muted-foreground">Pullbacks to <strong>40 or below</strong> = healthy retracement, good for longs</div>
            </div>
            <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="font-black text-destructive mb-1">Bearish Trend</div>
              <div className="text-muted-foreground">Pullbacks near <strong>20</strong>, momentum fades at <strong>60</strong> - risky longs</div>
            </div>
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <div className="font-black text-primary mb-1">Strong Trends</div>
              <div className="text-muted-foreground">Can extend to <strong>80</strong> - signals strength, not reversal</div>
            </div>
          </div>
<p className="text-[10px] text-warning/80 text-center italic border-l-2 border-warning/50 pl-2 py-1 bg-warning/5 rounded-r">
          This oscillator adapts to market trends and should be read in context, not as a standalone signal.
        </p>
      </div>

      <InfoModal
        isOpen={showModal}
        onClose={closeModal}
        title="Understanding Momentum Oscillator"
        sections={[
          {
            heading: "What is Momentum Oscillator?",
            content: "The Momentum Oscillator is a trend strength and exhaustion gauge that helps identify overbought and oversold conditions in the market. It measures the rate of change in price movements to assess market momentum."
          },
          {
            heading: "Bullish Trend Reading",
            content: "In a bullish trend, pullbacks to 40 or below represent healthy retracements. These levels are often good opportunities for long positions as the market is resetting for the next leg up."
          },
          {
            heading: "Bearish Trend Reading",
            content: "In a bearish trend, pullbacks near 20 and momentum fading at 60 indicate risky conditions for longs. The market lacks the strength to sustain rallies."
          },
          {
            heading: "Strong Trends",
            content: "In strong trending markets, momentum can extend to 80. This signals strength and continuation rather than an immediate reversal. Don't mistake high readings for automatic sell signals."
          }
        ]}
        videoLink="#"
      />
    </div>
  );
}
