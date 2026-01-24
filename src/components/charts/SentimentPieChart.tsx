import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface SentimentPieChartProps {
  buy: number;
  sell: number;
  hold: number;
  verdict: string;
  label?: string;
}

const SentimentPieChart = ({ buy, sell, hold, verdict, label = "Market Mood Today" }: SentimentPieChartProps) => {
  const data = [
    { name: "Buy", value: buy, color: "hsl(var(--chart-bullish))" },
    { name: "Sell", value: sell, color: "hsl(var(--chart-bearish))" },
    { name: "Hold", value: hold, color: "hsl(var(--chart-neutral))" },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/80 backdrop-blur-md px-3 py-2 border border-border/50 rounded-lg shadow-xl">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{payload[0].name}</p>
          <p className="text-xl font-black" style={{ color: payload[0].payload.color }}>
            {payload[0].value}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="w-full flex justify-between items-center mb-6">
        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className={`px-3 py-1 rounded-full text-xs font-bold bg-secondary/50 border border-border/50 text-success`}>
          Market Mood
        </div>
      </div>
      
      <div className="flex-1 flex items-center justify-center min-h-[220px]">
        <div className="relative w-full max-w-[220px] aspect-square">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                <filter id="pieGlow">
                  <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
                animationBegin={0}
                animationDuration={1500}
                stroke="none"
                filter="url(#pieGlow)"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Center text with pulsing effect */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center animate-pulse">
              <span className="text-4xl font-black text-foreground tracking-tighter">{buy}%</span>
              <p className="text-[10px] font-bold text-success uppercase tracking-widest">Buy Sentiment</p>
            </div>
          </div>
        </div>
      </div>

      {/* Improved Legend */}
      <div className="grid grid-cols-3 gap-2 mt-6">
        {data.map((item) => (
          <div key={item.name} className="flex flex-col items-center p-2 rounded-xl bg-secondary/50 border border-border/50">
            <div className="flex items-center gap-1.5 mb-1">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: item.color, boxShadow: `0 0 10px ${item.color}` }}
              />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">{item.name}</span>
            </div>
            <span className="text-sm font-black" style={{ color: item.color }}>{item.value}%</span>
          </div>
        ))}
      </div>

      <div className="text-center mt-6">
        <p className="text-sm font-black uppercase tracking-widest text-success px-4 py-1.5 rounded-full bg-success/10 border border-success/20 inline-block">
          {verdict}
        </p>
      </div>
    </div>
  );
};

export default SentimentPieChart;
