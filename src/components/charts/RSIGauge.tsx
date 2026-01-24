import { useEffect, useState } from "react";

interface RSIGaugeProps {
  value: number;
  verdict: string;
  label: string;
}

const RSIGauge = ({ value, verdict, label }: RSIGaugeProps) => {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), 500);
    return () => clearTimeout(timer);
  }, [value]);

  const rotation = (animatedValue / 100) * 180 - 90;

  const getColor = () => {
    if (value < 30) return "text-destructive";
    if (value > 70) return "text-success";
    return "text-warning";
  };

  const getColorClass = () => {
    if (value < 30) return "destructive";
    if (value > 70) return "success";
    return "warning";
  };

  const colorClass = getColorClass();

  return (
    <div className="h-full flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-6">
        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className={`px-3 py-1 rounded-full text-xs font-bold bg-secondary/50 border border-border/50 ${getColor()}`}>
          RSI
        </div>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        <div className="relative w-full max-w-[220px] aspect-[2/1]">
          <svg viewBox="0 0 200 100" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--chart-bearish))" />
                <stop offset="35%" stopColor="hsl(var(--chart-neutral))" />
                <stop offset="65%" stopColor="hsl(var(--chart-neutral))" />
                <stop offset="100%" stopColor="hsl(var(--chart-bullish))" />
              </linearGradient>
              <filter id="glow-gauge">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Background arc */}
            <path
              d="M 20 90 A 80 80 0 0 1 180 90"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="14"
              strokeLinecap="round"
              className="opacity-50 dark:opacity-20"
            />

            {/* Colored arc with glow */}
            <path
              d="M 20 90 A 80 80 0 0 1 180 90"
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth="14"
              strokeLinecap="round"
              filter="url(#glow-gauge)"
              className="opacity-80 transition-all duration-1000"
              style={{ strokeDasharray: 251, strokeDashoffset: 0 }}
            />

            {/* Tick marks */}
            {[0, 20, 40, 60, 80, 100].map((tick, i) => {
              const angle = (tick / 100) * 180 - 90;
              const rad = (angle * Math.PI) / 180;
              const x1 = 100 + 75 * Math.cos(rad);
              const y1 = 90 + 75 * Math.sin(rad);
              const x2 = 100 + 65 * Math.cos(rad);
              const y2 = 90 + 65 * Math.sin(rad);
              
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth="1"
                  className="opacity-30"
                />
              );
            })}

            {/* Needle */}
            <g
              style={{ 
                transform: `rotate(${rotation}deg)`,
                transformOrigin: "100px 90px",
                transition: "transform 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)"
              }}
            >
              <line
                x1="100"
                y1="90"
                x2="100"
                y2="20"
                stroke="hsl(var(--foreground))"
                strokeWidth="3"
                strokeLinecap="round"
                style={{ filter: "drop-shadow(0 0 4px hsl(var(--foreground) / 0.5))" }}
              />
              <circle
                cx="100"
                cy="90"
                r="7"
                fill="hsl(var(--foreground))"
                className="shadow-xl"
              />
              <circle
                cx="100"
                cy="90"
                r="3"
                fill="hsl(var(--background))"
              />
            </g>
          </svg>
        </div>

        <div className="text-center mt-6">
          <div className="flex flex-col items-center animate-scale-in">
            <span className={`text-5xl font-black tracking-tighter ${getColor()}`}>
              {Math.round(animatedValue)}
            </span>
            <p className={`text-sm font-bold mt-2 px-4 py-1 rounded-full bg-secondary/80 dark:bg-secondary/50 border border-border/50 ${getColor()}`}>
                {verdict}
              </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RSIGauge;
