/**
 * Leading number of a sheet cell, sign preserved.
 * "142.06 (-9.16%)" -> 142.06, "1,250" -> 1250, "-9.65" -> -9.65, "" / text -> null.
 */
export function parseSheetNumber(raw: string | number | undefined | null): number | null {
  if (raw === undefined || raw === null) return null;
  const m = raw.toString().replace(/[,₹\s]/g, "").match(/^[-+]?\d*\.?\d+/);
  if (!m) return null;
  const n = parseFloat(m[0]);
  return Number.isFinite(n) ? n : null;
}

/** A sheet cell shown as percentage points: "7" -> "7%", "16.04" -> "16.04%", "7%" stays "7%", blank -> null. */
function pctLabel(raw: string | undefined): string | null {
  const s = (raw ?? "").trim();
  if (!s) return null;
  return s.includes("%") ? s : `${s}%`;
}

export interface TradeRangeBarProps {
  /** Sheet column V */
  stoploss?: string;
  /** Sheet column L */
  target?: string;
  /** Sheet column Y */
  current?: string;
  /** Sheet column AB, shown as-is */
  potentialLeft?: string;
  /** Sheet column AC, shown as-is */
  stoplossDistance?: string;
  /** Sheet column AD, shown as-is */
  riskReward?: string;
  hideWhenUnavailable?: boolean;
}

/**
 * Stoploss (V) -> target (L) range bar with a marker at the current price (Y).
 * Every number shown comes straight from the sheet; the only arithmetic is where
 * the marker sits along the bar, which is layout. Sits above the
 * "LASA Research (SEBI RA)" footer of a Short Term Trades card.
 */
export function TradeRangeBar({
  stoploss, target, current, potentialLeft, stoplossDistance, riskReward, hideWhenUnavailable,
}: TradeRangeBarProps) {
  const sl = parseSheetNumber(stoploss);
  const tg = parseSheetNumber(target);
  const cur = parseSheetNumber(current);

  const hasRange = sl !== null && tg !== null && sl > 0 && tg > sl;
  if (!hasRange) {
    if (hideWhenUnavailable) return null;
    return (
      <div className="mb-3 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
        Stoploss / target range unavailable
      </div>
    );
  }

  // Marker position along the bar (layout only). Held at the ends if the price is outside the range.
  const markerLeft = cur !== null && cur > 0 ? Math.min(100, Math.max(0, ((cur - sl) / (tg - sl)) * 100)) : null;

  const left = pctLabel(stoplossDistance);
  const right = pctLabel(potentialLeft);
  const rr = (riskReward ?? "").trim();
  const showLabels = left !== null || right !== null || rr !== "";

  const aria = [
    left ? `Stoploss ${left}` : null,
    rr ? `risk reward ${rr}` : null,
    right ? `${right} potential left` : null,
  ].filter(Boolean).join(", ") || "Stoploss to target range";

  return (
    <div className="mb-3 px-1" role="img" aria-label={aria}>
      {showLabels && (
        <div className="flex items-center justify-between gap-2 mb-1.5 text-[11px] font-bold">
          {left ? (
            <span className="text-rose-400 font-mono" title={`Stoploss ${stoploss}`}>
              {left} <span className="text-[10px] font-semibold opacity-80">SL</span>
            </span>
          ) : <span />}

          {rr && (
            <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/80 font-mono text-[10px]">
              R:R {rr}
            </span>
          )}

          {right ? (
            <span className="text-emerald-400 font-mono" title={`Target ${target}`}>
              {right} <span className="text-[10px] font-semibold opacity-80">potential left</span>
            </span>
          ) : <span />}
        </div>
      )}

      <div className="relative h-2 rounded-full bg-white/10">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-rose-500/70 via-amber-400/50 to-emerald-500/70" />
        {markerLeft !== null && (
          <div
            className="absolute top-1/2 w-3.5 h-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-cyan-300 border-[#0b0f19] shadow-[0_0_8px_rgba(103,232,249,0.8)]"
            style={{ left: `${markerLeft}%` }}
            title={`Current ${current}`}
          />
        )}
      </div>
    </div>
  );
}
