import React, { useEffect, useState } from "react";

interface MLMeterProps {
  confidence: number;
  verdict: string;
  label: string;
}

export const MLMeter = ({ confidence, verdict, label }: MLMeterProps) => {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(confidence), 500);
    return () => clearTimeout(timer);
  }, [confidence]);

  const getColor = () => {
    if (confidence >= 70) return "success";
    if (confidence >= 50) return "warning";
    return "destructive";
  };

  const colorClass = getColor();
  const accentColor = colorClass === 'success' ? 'var(--chart-bullish)' : colorClass === 'warning' ? 'var(--chart-neutral)' : 'var(--chart-bearish)';

  return (
    <div className="h-full flex flex-col">
      <div className="w-full flex justify-between items-center mb-6">
        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className={`px-3 py-1 rounded-full text-xs font-bold bg-secondary/50 border border-border/50 text-${colorClass}`}>
          ML Model
        </div>
      </div>
      
      <div className="flex-1 flex flex-col justify-center">
        <div className="relative h-6 bg-secondary/40 rounded-full overflow-hidden mb-2 border border-border/50">
          {/* Animated background shimmer */}
          <div 
            className="absolute inset-0 opacity-10 pointer-events-none animate-shimmer"
            style={{
              background: `linear-gradient(90deg, transparent, currentColor, transparent)`,
            }}
          />
          
          {/* Progress bar */}
          <div
            className="h-full relative overflow-hidden transition-all duration-[1.5s] ease-out"
            style={{
              width: `${animatedValue}%`,
              backgroundColor: `hsl(${accentColor})`,
              boxShadow: `0 0 20px hsla(${accentColor}, 0.3)`,
            }}
          >
            <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] bg-[length:20px_20px] opacity-20 animate-[move-bg_2s_linear_infinite]" />
          </div>
        </div>

        <div className="flex justify-between text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest px-1 mb-8">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>

        {/* Neural Network Visualization */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`w-2.5 rounded-full transition-all duration-500 ${i < Math.ceil(animatedValue / 20) ? 'animate-bounce' : 'opacity-10'}`}
              style={{
                height: i < Math.ceil(animatedValue / 20) ? '32px' : '16px',
                backgroundColor: i < Math.ceil(animatedValue / 20) 
                  ? `hsl(${accentColor})` 
                  : 'hsl(var(--muted-foreground) / 0.2)',
                boxShadow: i < Math.ceil(animatedValue / 20) ? `0 0 10px hsla(${accentColor}, 0.4)` : 'none',
                animationDelay: `${i * 0.15}s`
              }}
            />
          ))}
        </div>

        <div className="text-center">
          <div className="animate-scale-in">
            <span className={`text-6xl font-black tracking-tighter text-${colorClass}`}>
              {Math.round(animatedValue)}%
            </span>
            <p className={`text-sm font-bold mt-2 uppercase tracking-widest text-${colorClass}`}>
              {verdict}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MLMeter;
