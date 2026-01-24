import { useEffect, useState } from "react";

interface OverallSentimentProps {
  value: number;
  verdict: string;
  label: string;
}

const OverallSentiment = ({ value, verdict, label }: OverallSentimentProps) => {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), 500);
    return () => clearTimeout(timer);
  }, [value]);

  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference - (animatedValue / 100) * circumference;

  const getColor = () => {
    if (value >= 60) return { text: "text-success", stroke: "hsl(142, 76%, 45%)" };
    if (value >= 40) return { text: "text-warning", stroke: "hsl(38, 92%, 50%)" };
    return { text: "text-destructive", stroke: "hsl(0, 72%, 51%)" };
  };

  const { text: textColor, stroke: strokeColor } = getColor();

  return (
    <div className="h-full flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-6">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
        <div className={`px-3 py-1 rounded-full text-xs font-semibold bg-white/5 border border-white/10 ${textColor}`}>
          Cast
        </div>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="relative w-[200px] h-[200px]">
          <svg className="w-full h-full transform -rotate-90 overflow-visible" viewBox="0 0 160 160">
            <defs>
              <linearGradient id="sentimentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={strokeColor} />
                <stop offset="100%" stopColor="hsl(var(--primary))" />
              </linearGradient>
              <filter id="circleGlow">
                <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Background circle */}
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="12"
            />

            {/* Animated progress circle */}
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="url(#sentimentGradient)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              filter="url(#circleGlow)"
              className="transition-all duration-[1.5s] ease-out opacity-80"
            />

            {/* Decorative dots */}
            {[0, 25, 50, 75, 100].map((tick, i) => {
              const angle = (tick / 100) * 360 - 90;
              const rad = (angle * Math.PI) / 180;
              const x = 80 + 70 * Math.cos(rad);
              const y = 80 + 70 * Math.sin(rad);
              
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="3"
                  fill="white"
                  className="opacity-20"
                />
              );
            })}
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center animate-scale-in">
              <span className={`text-5xl font-bold tracking-tight ${textColor}`}>{Math.round(animatedValue)}</span>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-1">/ 100 Score</p>
            </div>
          </div>

          {/* Pulsing outer ring */}
          <div 
            className="absolute inset-[-10px] rounded-full animate-pulse opacity-20 pointer-events-none"
            style={{
              boxShadow: `inset 0 0 40px ${strokeColor}`,
            }}
          />
        </div>

        <div className="text-center mt-10">
          <p className={`text-sm font-semibold uppercase tracking-wide ${textColor} px-6 py-2 rounded-full bg-white/5 border border-white/10`}>
            {verdict}
          </p>
        </div>
      </div>
    </div>
  );
};

export default OverallSentiment;

