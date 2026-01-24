import { useMarketPosition } from "@/hooks/useLiveData";
import { TrendingUp, TrendingDown, Activity, Target, RotateCcw, Loader2 } from "lucide-react";

interface IndicatorBarProps {
  label: string;
  leftLabel: string;
  rightLabel: string;
  leftValue: number;
  rightValue: number;
  icon: React.ReactNode;
  showRawNumbers?: boolean;
}

function IndicatorBar({ label, leftLabel, rightLabel, leftValue, rightValue, icon, showRawNumbers = false }: IndicatorBarProps) {
  const total = leftValue + rightValue || 1;
  const leftPercent = (leftValue / total) * 100;
  const rightPercent = (rightValue / total) * 100;
  const isLeftDominant = leftValue > rightValue;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
            {icon}
          </div>
          <span className="text-sm font-semibold text-foreground uppercase tracking-wide">{label}</span>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
          isLeftDominant 
            ? 'bg-success/10 text-success border border-success/20' 
            : 'bg-destructive/10 text-destructive border border-destructive/20'
        }`}>
          {isLeftDominant ? leftLabel : rightLabel}
        </span>
      </div>
      
      <div className="relative h-10 rounded-xl overflow-hidden bg-white/5 border border-white/10">
        <div 
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-success/80 to-success/40 transition-all duration-1000 ease-out flex items-center"
          style={{ width: `${leftPercent}%` }}
        >
          <span className="absolute left-3 text-xs font-bold text-white drop-shadow-lg">
            {leftLabel}
          </span>
          <span className="absolute right-2 text-sm font-bold text-white drop-shadow-lg">
            {showRawNumbers ? leftValue : `${leftValue}%`}
          </span>
        </div>
        
        <div 
          className="absolute inset-y-0 right-0 bg-gradient-to-l from-destructive/80 to-destructive/40 transition-all duration-1000 ease-out flex items-center"
          style={{ width: `${rightPercent}%` }}
        >
          <span className="absolute left-2 text-sm font-bold text-white drop-shadow-lg">
            {showRawNumbers ? rightValue : `${rightValue}%`}
          </span>
          <span className="absolute right-3 text-xs font-bold text-white drop-shadow-lg">
            {rightLabel}
          </span>
        </div>
        
        <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/30 -translate-x-1/2 z-10" />
      </div>
    </div>
  );
}

export default function MarketPositionStructure() {
  const { data, isLoading } = useMarketPosition();

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div className="space-y-1">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Market Position Structure</h3>
            <p className="text-xs text-muted-foreground/60 font-medium italic">Multi-modal analytical engine</p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  const overallBullish = 
    data.model.bullish + 
    data.balance.above + 
    data.momentum.bullish + 
    data.sr.atSupport + 
    data.reversal.up;
  
  const overallBearish = 
    data.model.bearish + 
    data.balance.below + 
    data.momentum.bearish + 
    data.sr.atResistance + 
    data.reversal.down;

  const verdict = overallBullish > overallBearish ? "BULLISH" : overallBearish > overallBullish ? "BEARISH" : "NEUTRAL";
  const verdictColor = verdict === "BULLISH" ? "text-success" : verdict === "BEARISH" ? "text-destructive" : "text-warning";

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-1">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Current Overall Market Position Structure</h3>
          <p className="text-xs text-muted-foreground/60 font-medium italic">Multi-modal analytical engine</p>
        </div>
        <div className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide bg-white/5 border border-white/10 ${verdictColor} shadow-[0_0_20px_rgba(255,255,255,0.05)]`}>
          {verdict}
        </div>
      </div>

      <div className="flex-1 space-y-5">
        <IndicatorBar
          label="Model"
          leftLabel="ML_UP"
          rightLabel="ML_DOWN"
          leftValue={data.model.bullish}
          rightValue={data.model.bearish}
          icon={<Activity className="w-4 h-4 text-chart-primary" />}
        />

        <IndicatorBar
          label="Balance"
          leftLabel="Avg-Above"
          rightLabel="Avg-Below"
          leftValue={data.balance.above}
          rightValue={data.balance.below}
          icon={<TrendingUp className="w-4 h-4 text-success" />}
        />

        <IndicatorBar
          label="Momentum"
          leftLabel="100-RSI"
          rightLabel="RSI"
          leftValue={data.momentum.bullish}
          rightValue={data.momentum.bearish}
          icon={<TrendingDown className="w-4 h-4 text-warning" />}
        />

        <IndicatorBar
          label="S/R"
          leftLabel="Support"
          rightLabel="Resistance"
          leftValue={data.sr.atSupport}
          rightValue={data.sr.atResistance}
          icon={<Target className="w-4 h-4 text-destructive" />}
          showRawNumbers={true}
        />

        <IndicatorBar
          label="Reversal"
          leftLabel="Reversal-Up"
          rightLabel="Reversal-Down"
          leftValue={data.reversal.up}
          rightValue={data.reversal.down}
          icon={<RotateCcw className="w-4 h-4 text-accent" />}
        />
      </div>

      <div className="mt-6 pt-4 border-t border-white/5">
        <div className="flex items-center justify-between text-xs text-muted-foreground/60">
          <span className="uppercase tracking-wider font-semibold">S/R & Reversal = Trade Triggers</span>
          <span className="uppercase tracking-wider font-semibold">Model, Balance, Momentum = Current State</span>
        </div>
      </div>
    </div>
  );
}
