export type TradeBarState = "inside" | "below" | "above" | "missing";

export interface TradeBarInput {
  buy: number | null;
  stoploss: number | null;
  target: number | null;
  current: number | null;
}

export interface TradeBarMetrics {
  /** ((target - buy) / buy) * 100 */
  potentialPct: number | null;
  /** ((buy - stoploss) / buy) * 100 */
  stoplossPct: number | null;
  /** (target - buy) / (buy - stoploss) */
  riskReward: number | null;
  /** ((current - stoploss) / (target - stoploss)) * 100, unclamped */
  markerPos: number | null;
  /** True when stoploss < target, so the bar has a range to draw */
  hasRange: boolean;
  state: TradeBarState;
}

const isNum = (n: number | null | undefined): n is number =>
  typeof n === "number" && Number.isFinite(n);

/** Sheet cells arrive as strings ("1,250", "₹95", ""). A price of 0 means "not set". */
export function toPrice(val: string | number | undefined | null): number | null {
  if (val === undefined || val === null) return null;
  const n = parseFloat(val.toString().replace(/[,₹%\s]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function getTradeBarMetrics({ buy, stoploss, target, current }: TradeBarInput): TradeBarMetrics {
  const potentialPct = isNum(buy) && buy > 0 && isNum(target) ? ((target - buy) / buy) * 100 : null;
  const stoplossPct = isNum(buy) && buy > 0 && isNum(stoploss) ? ((buy - stoploss) / buy) * 100 : null;

  const risk = isNum(buy) && isNum(stoploss) ? buy - stoploss : null;
  const riskReward = isNum(buy) && isNum(target) && risk !== null && risk > 0 ? (target - buy) / risk : null;

  const range = isNum(target) && isNum(stoploss) ? target - stoploss : null;
  const hasRange = range !== null && range > 0;
  const markerPos = hasRange && isNum(current) && isNum(stoploss) ? ((current - stoploss) / range) * 100 : null;

  let state: TradeBarState = "inside";
  if (markerPos === null) state = "missing";
  else if (markerPos < 0) state = "below";
  else if (markerPos > 100) state = "above";

  return { potentialPct, stoplossPct, riskReward, markerPos, hasRange, state };
}

const fmtPct = (n: number) => n.toFixed(1).replace(/\.0$/, "");
const fmtPrice = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const MARKER_STYLE: Record<TradeBarState, string> = {
  inside: "bg-cyan-300 border-[#0b0f19] shadow-[0_0_8px_rgba(103,232,249,0.8)]",
  above: "bg-emerald-300 border-[#0b0f19] shadow-[0_0_8px_rgba(110,231,183,0.8)]",
  below: "bg-rose-400 border-[#0b0f19] shadow-[0_0_8px_rgba(251,113,133,0.9)] animate-pulse",
  missing: "hidden",
};

const CAPTION: Partial<Record<TradeBarState, { text: string; className: string }>> = {
  below: { text: "Below stoploss", className: "text-rose-400" },
  above: { text: "Beyond target", className: "text-emerald-400" },
  missing: { text: "Current price unavailable", className: "text-muted-foreground/70" },
};

/**
 * Stoploss → target range bar with a current-price marker.
 * Sits above the "LASA Research (SEBI RA)" footer of a Short Term Trades card.
 */
export function TradeRangeBar(props: TradeBarInput) {
  const m = getTradeBarMetrics(props);

  if (!m.hasRange || m.stoplossPct === null || m.potentialPct === null) {
    return (
      <div className="mb-3 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
        Stoploss / target range unavailable
      </div>
    );
  }

  const markerLeft = m.markerPos === null ? 0 : Math.min(100, Math.max(0, m.markerPos));
  const caption = CAPTION[m.state];
  const aria = [
    `Stoploss ${fmtPct(m.stoplossPct)}% below buy`,
    `target ${fmtPct(m.potentialPct)}% above buy`,
    m.riskReward !== null ? `risk to reward 1 to ${m.riskReward.toFixed(1)}` : null,
    caption?.text ?? null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="mb-3 px-1" role="img" aria-label={aria}>
      <div className="flex items-center justify-between gap-2 mb-1.5 text-[11px] font-bold">
        <span className="text-rose-400 font-mono" title={props.stoploss !== null ? `Stoploss ${fmtPrice(props.stoploss)}` : undefined}>
          −{fmtPct(m.stoplossPct)}% <span className="text-[10px] font-semibold opacity-80">SL</span>
        </span>

        {m.riskReward !== null && (
          <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/80 font-mono text-[10px]">
            R:R 1:{m.riskReward.toFixed(1)}
          </span>
        )}

        <span className="text-emerald-400 font-mono" title={props.target !== null ? `Target ${fmtPrice(props.target)}` : undefined}>
          {fmtPct(m.potentialPct)}% <span className="text-[10px] font-semibold opacity-80">potential</span>
        </span>
      </div>

      <div className="relative h-2 rounded-full bg-white/10">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-rose-500/70 via-amber-400/50 to-emerald-500/70" />
        <div
          className={`absolute top-1/2 w-3.5 h-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${MARKER_STYLE[m.state]}`}
          style={{ left: `${markerLeft}%` }}
          title={props.current !== null ? `Current ${fmtPrice(props.current)}` : undefined}
        />
      </div>

      {caption && (
        <div className={`mt-1.5 text-center text-[10px] font-bold uppercase tracking-wider ${caption.className}`}>
          {caption.text}
        </div>
      )}
    </div>
  );
}
