import { useMarketPosition } from "@/hooks/useLiveData";
import { TrendingUp, TrendingDown, Activity, Target, RotateCcw, Loader2, Info, X, Play } from "lucide-react";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MarketPositionStructureProps {
  eodDate?: string | null;
}

interface IndicatorBarProps {
  label: string;
  leftLabel: string;
  rightLabel: string;
  leftValue: number;
  rightValue: number;
  icon: React.ReactNode;
  showRawNumbers?: boolean;
  tooltip: string;
}

function IndicatorBar({ label, leftLabel, rightLabel, leftValue, rightValue, icon, showRawNumbers = false, tooltip }: IndicatorBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const total = leftValue + rightValue || 1;
  const leftPercent = (leftValue / total) * 100;
  const rightPercent = (rightValue / total) * 100;
  const isLeftDominant = leftValue > rightValue;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip open={isOpen} onOpenChange={setIsOpen}>
        <TooltipTrigger asChild>
          <div
            className="space-y-2 cursor-help"
            onClick={() => setIsOpen(!isOpen)}
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                {icon}
              </div>
              <span className="text-sm font-semibold text-foreground uppercase tracking-wide">{label}</span>
            </div>

            <div className="relative h-8 rounded-xl overflow-hidden bg-white/5 border border-white/10">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-success/80 to-success/40 transition-all duration-1000 ease-out flex items-center justify-center"
                style={{ width: `${leftPercent}%` }}
              >
                <span className="text-sm font-bold text-white drop-shadow-lg">
                  {showRawNumbers ? leftValue : `${leftValue}%`}
                </span>
              </div>

              <div
                className="absolute inset-y-0 right-0 bg-gradient-to-l from-destructive/80 to-destructive/40 transition-all duration-1000 ease-out flex items-center justify-center"
                style={{ width: `${rightPercent}%` }}
              >
                <span className="text-sm font-bold text-white drop-shadow-lg">
                  {showRawNumbers ? rightValue : `${rightValue}%`}
                </span>
              </div>

              <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/30 -translate-x-1/2 z-10" />
            </div>

            <div className="flex justify-between text-xs font-semibold">
              <span className="text-success drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]">{leftLabel}</span>
              <span className="text-destructive drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">{rightLabel}</span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs bg-background/95 backdrop-blur-xl border-white/20">
          <p className="text-sm font-medium">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function MarketPositionStructure({ eodDate }: MarketPositionStructureProps) {
  const { data, isLoading } = useMarketPosition();
  const [dynamicUpdate, setDynamicUpdate] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'sir_edits'), orderBy('timestamp', 'desc'), limit(1));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setDynamicUpdate(snapshot.docs[0].data().content);
      }
    });
    return () => unsubscribe();
  }, []);

  if (isLoading || !data) {
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
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Current Overall Market Position Structure {eodDate && <span className="text-warning/80">(AS OF {eodDate})</span>}
          </h3>
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
          tooltip="The model uses machine learning to analyze market data and identify the percentage of stocks showing higher price potential."
        />

        <IndicatorBar
          label="Balance"
          leftLabel="Avg-Above"
          rightLabel="Avg-Below"
          leftValue={data.balance.above}
          rightValue={data.balance.below}
          icon={<TrendingUp className="w-4 h-4 text-success" />}
          showRawNumbers={true}
          tooltip="The balance algorithm analyzes price behavior to identify upside and downside imbalances."
        />

        <IndicatorBar
          label="Momentum"
          leftLabel="100-RSI"
          rightLabel="RSI"
          leftValue={data.momentum.bullish}
          rightValue={data.momentum.bearish}
          icon={<TrendingDown className="w-4 h-4 text-warning" />}
          tooltip="Analyzes overbought and oversold conditions based on RSI"
        />

        <IndicatorBar
          label="S/R"
          leftLabel="Support"
          rightLabel="Resistance"
          leftValue={data.sr.atSupport}
          rightValue={data.sr.atResistance}
          icon={<Target className="w-4 h-4 text-destructive" />}
          showRawNumbers={true}
          tooltip="Based on price action, Identifies number of stocks developing support or resistance pattern, early indicator for reversals"
        />

        <IndicatorBar
          label="Reversal"
          leftLabel="Reversal-Up"
          rightLabel="Reversal-Down"
          leftValue={data.reversal.up}
          rightValue={data.reversal.down}
          icon={<RotateCcw className="w-4 h-4 text-accent" />}
          tooltip="Identifies stocks showing early reversal signals for potential upward vs downward trend changes"
        />
      </div>

      <div className="mt-6 pt-4 border-t border-white/5">
        <div className="flex items-center justify-between text-xs text-muted-foreground/60">
          <span className="uppercase tracking-wider font-semibold">S/R & Reversal = Trade Triggers</span>
          <span className="uppercase tracking-wider font-semibold">Model, Balance, Momentum = Current State</span>
        </div>
      </div>

      <SummaryWithInfo dynamicContent={dynamicUpdate} />
    </div>
  );
}

function SummaryWithInfo({ dynamicContent }: { dynamicContent: string | null }) {
  const [showModal, setShowModal] = useState(false);
  const defaultDesc = "This multi-modal engine combines multiple analytical models to map current market positioning across trends, patterns, and probabilities. It integrates historical context with predictive intelligence to project likely market movements. Bullish signals indicate oversold conditions with upside potential; bearish signals warn of over-extended markets preparing for reversal.";

  return (
    <>
      <div className="mt-5 p-5 rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <h4 className="text-sm font-semibold text-foreground/90 tracking-wide">How It Works</h4>
            <p className="text-sm text-white font-semibold leading-relaxed">
              {dynamicContent || defaultDesc}
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex-shrink-0 p-2.5 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 hover:border-primary/40 hover:scale-105 transition-all duration-200 group shadow-[0_0_15px_rgba(var(--primary),0.1)]"
            title="Learn more"
          >
            <Info className="w-5 h-5 text-primary/70 group-hover:text-primary transition-colors" />
          </button>
        </div>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-background/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between p-4 border-b border-white/10 bg-background/95 backdrop-blur-xl">
              <h3 className="text-lg font-semibold text-foreground">Understanding Market Position Structure</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-primary uppercase tracking-wide">Multi-Modal Analysis Engine</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Multi-modal structure integrates multiple analytical models to map how current data is positioned across trends, patterns, and probabilities—giving a clear snapshot of the present state. By combining historical context with predictive intelligence, it projects what is likely to unfold in the coming weeks, enabling informed, forward-looking decisions rather than reactive ones.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-primary uppercase tracking-wide">Signal Interpretation</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  When most components turn bullish, it signals an oversold market with high probability of an upside reversal; when they turn bearish, it indicates an over-extended market preparing for a downside reversal. It helps traders significantly reduce bad trades.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-primary uppercase tracking-wide flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Video Tutorial
                </h4>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-xs text-muted-foreground mb-3">Watch our detailed explanation video:</p>
                  <a
                    href="#"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/20 border border-primary/30 text-primary text-sm font-medium hover:bg-primary/30 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    Watch Video Guide
                  </a>
                </div>
              </div>

              {/* Compliance Disclaimer */}
              <div className="pt-6 border-t border-white/10">
                <p className="text-[10px] text-muted-foreground/60 italic leading-relaxed">
                  This indicator analyses historical price behaviour to highlight observable market characteristics. It does not predict future prices and should be interpreted as analytical context only.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
