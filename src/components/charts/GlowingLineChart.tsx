"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/line-chart";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, BrainCircuit } from "lucide-react";

const chartData = [
  { month: "Jan", accuracy: 82, confidence: 75 },
  { month: "Feb", accuracy: 85, confidence: 78 },
  { month: "Mar", accuracy: 83, confidence: 82 },
  { month: "Apr", accuracy: 88, confidence: 85 },
  { month: "May", accuracy: 92, confidence: 88 },
  { month: "Jun", accuracy: 90, confidence: 91 },
];

const chartConfig = {
  accuracy: {
    label: "Accuracy",
    color: "hsl(var(--chart-primary))",
  },
  confidence: {
    label: "Confidence",
    color: "hsl(var(--chart-secondary))",
  },
} satisfies ChartConfig;

export default function GlowingLineChart() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <BrainCircuit className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold">ML Performance</h3>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Predictive Intelligence</p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="text-success bg-success/10 border-success/20 flex items-center gap-1 py-1"
        >
          <TrendingUp className="h-3 w-3" />
          <span className="font-bold">91% Accuracy</span>
        </Badge>
      </div>

      <div className="flex-1 min-h-[220px]">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 0,
              right: 10,
              top: 10,
              bottom: 0,
            }}
          >
            <CartesianGrid 
              vertical={false} 
              strokeDasharray="4 4" 
              className="stroke-muted/20" 
            />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              className="text-[10px] font-medium fill-muted-foreground"
            />
            <YAxis 
              hide 
              domain={['dataMin - 10', 'dataMax + 10']}
            />
            <ChartTooltip
              cursor={{ stroke: 'hsl(var(--muted))', strokeWidth: 1 }}
              content={<ChartTooltipContent />}
            />
            <Line
              dataKey="accuracy"
              type="monotone"
              stroke="var(--color-accuracy)"
              dot={{ r: 4, fill: "var(--color-accuracy)", strokeWidth: 0 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
              strokeWidth={3}
              filter="url(#glow)"
            />
            <Line
              dataKey="confidence"
              type="monotone"
              stroke="var(--color-confidence)"
              dot={{ r: 4, fill: "var(--color-confidence)", strokeWidth: 0 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
              strokeWidth={3}
              filter="url(#glow)"
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
      
      <div className="mt-4 pt-4 border-t border-border/50 flex justify-between items-center text-xs">
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[var(--color-accuracy)]" />
            <span className="text-muted-foreground">Model Accuracy</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[var(--color-confidence)]" />
            <span className="text-muted-foreground">Network Confidence</span>
          </div>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">v2.4.0-stable</span>
      </div>
    </div>
  );
}
