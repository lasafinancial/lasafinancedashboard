"use client";

import { CartesianGrid, XAxis, YAxis, Tooltip, ComposedChart, Line, Area, ResponsiveContainer, Legend } from "recharts";
import {
  ChartConfig,
  ChartContainer,
} from "@/components/ui/line-chart";
import { TrendingUp, Activity } from "lucide-react";
import { useMemo } from "react";

interface NiftyCloseChartProps {
  data: any[];
}

const chartConfig = {
  nifty50_close: {
    label: "Nifty 50 Close",
    color: "#3b82f6",
  },
  momentum_oscillator: {
    label: "Momentum Oscillator",
    color: "#f59e0b",
  },
  total_score: {
    label: "Balance",
    color: "#22c55e",
  },
  ml_higher: {
    label: "Model",
    color: "#a855f7",
  },
} satisfies ChartConfig;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const nifty = payload.find((p: any) => p.dataKey === 'nifty50_close')?.value || 0;
    const momentum = payload.find((p: any) => p.dataKey === 'momentum_oscillator')?.value || 0;
    const balance = payload.find((p: any) => p.dataKey === 'total_score')?.value || 0;
    const model = payload.find((p: any) => p.dataKey === 'ml_higher')?.value || 0;
    
    return (
      <div className="bg-background/95 border border-border/50 rounded-lg p-2.5 shadow-lg backdrop-blur-sm">
        <p className="text-[10px] text-muted-foreground mb-1.5 font-medium">{label}</p>
        <div className="space-y-0.5 text-xs">
          <p className="font-semibold text-blue-400">Nifty 50: {nifty.toLocaleString()}</p>
          <p className="font-semibold text-amber-400">Momentum: {momentum}</p>
          <p className="font-semibold text-green-400">Balance: {balance}</p>
          <p className="font-semibold text-purple-400">Model: {model}</p>
        </div>
      </div>
    );
  }
  return null;
};

export default function NiftyCloseChart({ data }: NiftyCloseChartProps) {
  const chartData = useMemo(() => {
    return data
      .filter(item => item.date && item.nifty50_close > 0)
      .map(item => ({
        ...item,
        nifty50_close: item.nifty50_close,
        momentum_oscillator: item.momentum_oscillator || item.rsi || 0,
        total_score: (item.total_score || 0) * 10,
        ml_higher: item.ml_higher || 0,
      }));
  }, [data]);

  const latest = chartData[chartData.length - 1];
  const niftyClose = latest?.nifty50_close || 0;
  const momentum = latest?.momentum_oscillator || 0;
  const balance = data[data.length - 1]?.total_score || 0;
  const model = latest?.ml_higher || 0;

  const niftyMin = Math.min(...chartData.map(d => d.nifty50_close).filter(v => v > 0)) * 0.98;
  const niftyMax = Math.max(...chartData.map(d => d.nifty50_close).filter(v => v > 0)) * 1.02;

  if (chartData.length === 0 || !niftyClose) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
        <Activity className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-sm">No Nifty 50 data available</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-blue-500/10">
            <TrendingUp className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nifty 50 Close</h3>
            <p className="text-xs text-muted-foreground/60 font-medium italic">With Indicators</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-blue-400">{niftyClose.toLocaleString()}</div>
          <div className="text-[10px] text-muted-foreground">Latest Close</div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="w-full">
          <div className="h-[200px] max-sm:h-[180px] lg:h-[280px] w-full">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <ComposedChart
                data={chartData}
                margin={{ left: 5, right: 5, top: 5, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="niftyAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
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
                  yAxisId="nifty"
                  orientation="right"
                  tick={{ fontSize: 8 }}
                  axisLine={false}
                  tickLine={false}
                  width={50}
                  domain={[niftyMin, niftyMax]}
                  tickFormatter={(value) => value.toLocaleString()}
                  className="fill-muted-foreground/70"
                />
                <YAxis 
                  yAxisId="indicators"
                  orientation="left"
                  tick={{ fontSize: 8 }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                  domain={[0, 100]}
                  className="fill-muted-foreground/70"
                />
                <Tooltip content={<CustomTooltip />} />
                
                <Area
                  yAxisId="nifty"
                  type="monotone"
                  dataKey="nifty50_close"
                  stroke="transparent"
                  fill="url(#niftyAreaGradient)"
                />
                <Line
                  yAxisId="nifty"
                  type="monotone"
                  dataKey="nifty50_close"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
                />
                <Line
                  yAxisId="indicators"
                  type="monotone"
                  dataKey="momentum_oscillator"
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                  dot={false}
                  strokeDasharray="4 2"
                  activeDot={{ r: 3, fill: "#f59e0b", stroke: "#fff", strokeWidth: 1 }}
                />
                <Line
                  yAxisId="indicators"
                  type="monotone"
                  dataKey="total_score"
                  stroke="#22c55e"
                  strokeWidth={1.5}
                  dot={false}
                  strokeDasharray="4 2"
                  activeDot={{ r: 3, fill: "#22c55e", stroke: "#fff", strokeWidth: 1 }}
                />
                <Line
                  yAxisId="indicators"
                  type="monotone"
                  dataKey="ml_higher"
                  stroke="#a855f7"
                  strokeWidth={1.5}
                  dot={false}
                  strokeDasharray="4 2"
                  activeDot={{ r: 3, fill: "#a855f7", stroke: "#fff", strokeWidth: 1 }}
                />
              </ComposedChart>
            </ChartContainer>
          </div>
          
          <div className="flex items-center justify-center gap-4 mt-2 text-[9px] flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 rounded-sm bg-blue-500"></div>
              <span className="text-muted-foreground/80">Nifty 50</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 rounded-sm bg-amber-500" style={{backgroundImage: 'linear-gradient(90deg, #f59e0b 50%, transparent 50%)', backgroundSize: '4px 100%'}}></div>
              <span className="text-muted-foreground/80">Momentum</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 rounded-sm bg-green-500" style={{backgroundImage: 'linear-gradient(90deg, #22c55e 50%, transparent 50%)', backgroundSize: '4px 100%'}}></div>
              <span className="text-muted-foreground/80">Balance</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 rounded-sm bg-purple-500" style={{backgroundImage: 'linear-gradient(90deg, #a855f7 50%, transparent 50%)', backgroundSize: '4px 100%'}}></div>
              <span className="text-muted-foreground/80">Model</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 max-sm:grid-cols-2">
          <div className="p-2.5 max-sm:p-2 rounded-lg bg-blue-500/5 border border-blue-500/20 text-center">
            <div className="text-[9px] max-sm:text-[8px] font-bold text-blue-400/70 uppercase mb-0.5">Nifty Close</div>
            <div className="text-lg max-sm:text-base font-black text-blue-400">{niftyClose.toLocaleString()}</div>
          </div>
          <div className="p-2.5 max-sm:p-2 rounded-lg bg-amber-500/5 border border-amber-500/20 text-center">
            <div className="text-[9px] max-sm:text-[8px] font-bold text-amber-400/70 uppercase mb-0.5">Momentum</div>
            <div className="text-lg max-sm:text-base font-black text-amber-400">{momentum}</div>
          </div>
          <div className="p-2.5 max-sm:p-2 rounded-lg bg-green-500/5 border border-green-500/20 text-center">
            <div className="text-[9px] max-sm:text-[8px] font-bold text-green-400/70 uppercase mb-0.5">Balance</div>
            <div className="text-lg max-sm:text-base font-black text-green-400">{balance}</div>
          </div>
          <div className="p-2.5 max-sm:p-2 rounded-lg bg-purple-500/5 border border-purple-500/20 text-center">
            <div className="text-[9px] max-sm:text-[8px] font-bold text-purple-400/70 uppercase mb-0.5">Model</div>
            <div className="text-lg max-sm:text-base font-black text-purple-400">{model}</div>
          </div>
        </div>

        <div className="mt-2 p-2.5 rounded-lg bg-muted/5 border border-muted/10">
          <p className="text-[11px] max-sm:text-[10px] text-muted-foreground/70 leading-relaxed">
            <span className="font-semibold text-muted-foreground/90">Nifty 50 Close</span> shows the daily closing price of the Nifty 50 index alongside key indicators: 
            <span className="font-semibold text-amber-400"> Momentum Oscillator</span> (RSI % above 50), 
            <span className="font-semibold text-green-400"> Balance</span> (Total Score), and 
            <span className="font-semibold text-purple-400"> Model</span> (ML Prediction %).
          </p>
        </div>
      </div>
    </div>
  );
}
