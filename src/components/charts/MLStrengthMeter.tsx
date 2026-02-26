"use client";

import { useState, useCallback, useMemo } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis, Legend, Tooltip, ReferenceLine } from "recharts";
import {
  ChartConfig,
  ChartContainer,
} from "@/components/ui/line-chart";
import { BrainCircuit } from "lucide-react";
import { InfoModal, InfoModalTrigger, useInfoModal } from "@/components/ui/InfoModal";

interface MLStrengthMeterProps {
  data: any[];
  eodDate?: string | null;
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
  nifty50_normalized: {
    label: "NIFTY 50",
    color: "#eab308",
  },
} satisfies ChartConfig;

interface HoveredData {
  date: string;
  mlHigher: number | null;
  mlLower: number | null;
  nifty50: number | null;
}

export default function MLStrengthMeter({ data, eodDate }: MLStrengthMeterProps) {
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
        mlHigher: payload?.ml_higher ?? null,
        mlLower: payload?.ml_lower ?? null,
        nifty50: payload?.nifty50_close ?? null,
      });
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredData(null);
  }, []);

  const latest = data[data.length - 1];
  const latestMlHigher = latest?.ml_higher ?? 0;

  const displayValue = hoveredData?.mlHigher ?? latestMlHigher;
  const isAbove60 = displayValue > 60;
  const isMixed = displayValue >= 50 && displayValue <= 60;
  const isBelow50 = displayValue < 50;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-accent/10">
            <BrainCircuit className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Model-Derived Trend Bias {eodDate && <span className="text-warning/80">(AS OF {eodDate})</span>}
            </h3>
            <p className="text-xs text-muted-foreground/60 font-medium italic">Historical Pattern Analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {hoveredData ? (
            <div className="bg-card/95 backdrop-blur-sm rounded-lg border border-border/50 px-3 py-2 shadow-lg">
              <p className="text-xs text-muted-foreground mb-1">{hoveredData.date}</p>
              <div className="flex items-center gap-4 flex-wrap">
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
                {hoveredData.nifty50 && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#eab308]" />
                    <span className="text-xs text-muted-foreground">NIFTY 50</span>
                    <span className="text-sm font-semibold text-[#eab308]">{hoveredData.nifty50.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 text-xs flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
                <span className="text-muted-foreground uppercase font-bold tracking-wide">Positive Bias</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#ef4444]" />
                <span className="text-muted-foreground uppercase font-bold tracking-wide">Negative Bias</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#eab308]" />
                <span className="text-muted-foreground uppercase font-bold tracking-wide">NIFTY 50</span>
              </div>
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
            />
            <Line
              dataKey="ml_lower"
              name="ml_lower"
              type="monotone"
              stroke="var(--color-ml_lower)"
              dot={{ r: 3, fill: "var(--color-ml_lower)", strokeWidth: 0 }}
              strokeWidth={3}
            />
            <Line
              dataKey="nifty50_normalized"
              name="NIFTY 50"
              type="monotone"
              stroke="#eab308"
              dot={false}
              strokeWidth={3}
            />
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
          <span className={`font-semibold ${isAbove60 ? 'text-success' : 'text-foreground'}`}>• Above 60:</span> Majority of stocks have cooled off after pullbacks. Historically, such conditions have coincided with stronger upward price behaviour.
          <li className={`p-2 rounded transition-all duration-300 ${isMixed ? 'bg-warning/10 border-l-2 border-warning shadow-[inset_0_0_10px_rgba(251,191,36,0.05)]' : ''}`}>
            <span className={`font-semibold ${isMixed ? 'text-warning' : 'text-foreground'}`}>• 50–60:</span> Mixed conditions. Selective trading is advised with strict risk control.
          </li>
          <span className={`font-semibold ${isBelow50 ? 'text-destructive' : 'text-foreground'}`}>• Below 50:</span> Most stocks are extended. This condition reflects increasing downside sensitivity in the market.
        </ul>
        <p className="text-[10px] text-muted-foreground italic">
          The ML Meter is a probability-based market indicator and not a buy/sell signal.
        </p>
      </div>

      <InfoModal
        isOpen={showModal}
        onClose={closeModal}
        title="Understanding ML Meter – Market Bias Indicator"
        sections={[
          {
            heading: "What is ML Meter?",
            content: "The ML Meter reflects the overall market's readiness for upside moves by analysing stock positioning after pullbacks and extensions. It uses machine learning models to assess whether stocks are better positioned for potential upside swings."
          },
          {
            heading: "Above 60 – Bullish Zone",
            content: "Majority of stocks have cooled off after pullbacks. Historically, such conditions have coincided with stronger upward price behaviour."
          },
          {
            heading: "50–60 – Mixed Zone",
            content: "Mixed conditions prevail. Selective trading is advised with strict risk control. Wait for clearer signals before taking positions."
          },
          {
            heading: "Below 50 – Caution Zone",
            content: "Most stocks are extended. This condition reflects increasing downside sensitivity in the market."
          }
        ]}
        videoLink="#"
      />
    </div>
  );
}
