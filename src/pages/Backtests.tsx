import { useState } from "react";
import { FlaskConical, TrendingUp, TrendingDown, BarChart3, Calendar, Percent, Target } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart, ReferenceLine } from "recharts";

const mockBacktestData = [
  { date: "2025-07", returns: 2.5, trades: 12, winRate: 67 },
  { date: "2025-08", returns: -1.2, trades: 15, winRate: 53 },
  { date: "2025-09", returns: 4.8, trades: 18, winRate: 72 },
  { date: "2025-10", returns: 3.2, trades: 14, winRate: 64 },
  { date: "2025-11", returns: -0.5, trades: 10, winRate: 50 },
  { date: "2025-12", returns: 5.1, trades: 20, winRate: 75 },
];

const strategies = [
  {
    name: "Trend Following",
    description: "Buy on breakouts above resistance with RSI confirmation",
    totalReturn: 13.9,
    winRate: 63.5,
    maxDrawdown: -4.2,
    sharpeRatio: 1.85,
    trades: 89,
  },
  {
    name: "Mean Reversion",
    description: "Buy oversold stocks near support levels",
    totalReturn: 8.2,
    winRate: 58.2,
    maxDrawdown: -6.1,
    sharpeRatio: 1.42,
    trades: 124,
  },
  {
    name: "ML Model Signal",
    description: "Trade based on ML predicted price targets",
    totalReturn: 18.5,
    winRate: 61.0,
    maxDrawdown: -5.8,
    sharpeRatio: 2.12,
    trades: 67,
  },
];

const Backtests = () => {
  const [selectedStrategy, setSelectedStrategy] = useState(strategies[0]);

  const cumulativeData = mockBacktestData.reduce((acc, item, idx) => {
    const prevValue = idx > 0 ? acc[idx - 1].cumulative : 100;
    const cumulative = prevValue * (1 + item.returns / 100);
    acc.push({ ...item, cumulative: cumulative });
    return acc;
  }, [] as any[]);

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-3">
            <FlaskConical className="w-3 h-3" />
            Strategy Performance
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-none">
            Backtest <span className="gradient-text italic pr-2">Results</span>
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl font-medium mt-2">
            Historical performance analysis of trading strategies based on LASA indicators.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          {strategies.map((strategy) => (
            <GlassCard
              key={strategy.name}
              className={`p-4 cursor-pointer transition-all ${
                selectedStrategy.name === strategy.name
                  ? "border-primary/50 bg-primary/5"
                  : "hover:border-border/80"
              }`}
              onClick={() => setSelectedStrategy(strategy)}
            >
              <h3 className="font-semibold text-sm mb-1">{strategy.name}</h3>
              <p className="text-xs text-muted-foreground mb-3">{strategy.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-success" />
                  <span className="text-success font-bold">{strategy.totalReturn}%</span>
                </div>
                <span className="text-xs text-muted-foreground">Win: {strategy.winRate}%</span>
              </div>
            </GlassCard>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <GlassCard className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Percent className="w-4 h-4 text-success" />
              <span className="text-xs text-muted-foreground uppercase font-semibold">Total Return</span>
            </div>
            <p className={`text-2xl font-bold ${selectedStrategy.totalReturn >= 0 ? "text-success" : "text-destructive"}`}>
              {selectedStrategy.totalReturn >= 0 ? "+" : ""}{selectedStrategy.totalReturn}%
            </p>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground uppercase font-semibold">Win Rate</span>
            </div>
            <p className="text-2xl font-bold">{selectedStrategy.winRate}%</p>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-destructive" />
              <span className="text-xs text-muted-foreground uppercase font-semibold">Max Drawdown</span>
            </div>
            <p className="text-2xl font-bold text-destructive">{selectedStrategy.maxDrawdown}%</p>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-warning" />
              <span className="text-xs text-muted-foreground uppercase font-semibold">Sharpe Ratio</span>
            </div>
            <p className="text-2xl font-bold">{selectedStrategy.sharpeRatio}</p>
          </GlassCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlassCard className="p-6">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Monthly Returns
            </h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={mockBacktestData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                  <Area
                    type="monotone"
                    dataKey="returns"
                    stroke="transparent"
                    fill="url(#returnGradient)"
                  />
                  <Line
                    type="monotone"
                    dataKey="returns"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                  />
                  <defs>
                    <linearGradient id="returnGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-success" />
              Equity Curve
            </h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={cumulativeData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value.toFixed(2)}`, 'Portfolio Value']}
                  />
                  <ReferenceLine y={100} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                  <Area
                    type="monotone"
                    dataKey="cumulative"
                    stroke="transparent"
                    fill="url(#equityGradient)"
                  />
                  <Line
                    type="monotone"
                    dataKey="cumulative"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={false}
                  />
                  <defs>
                    <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        <GlassCard className="mt-6 p-6">
          <h3 className="text-sm font-semibold mb-4">Trade History Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 px-3 text-muted-foreground font-semibold">Month</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-semibold">Returns</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-semibold">Trades</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-semibold">Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {mockBacktestData.map((item) => (
                  <tr key={item.date} className="border-b border-border/30 hover:bg-secondary/30">
                    <td className="py-2 px-3 font-medium">{item.date}</td>
                    <td className={`py-2 px-3 text-right font-mono ${item.returns >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {item.returns >= 0 ? '+' : ''}{item.returns}%
                    </td>
                    <td className="py-2 px-3 text-right">{item.trades}</td>
                    <td className="py-2 px-3 text-right">{item.winRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <div className="mt-6 p-4 rounded-lg bg-warning/5 border border-warning/20">
          <p className="text-xs text-warning/80 text-center">
            Backtest results are based on historical data and do not guarantee future performance. 
            Past performance is not indicative of future results. Always conduct your own research before trading.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Backtests;
