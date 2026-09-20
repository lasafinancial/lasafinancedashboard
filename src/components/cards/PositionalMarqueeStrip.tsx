import { useEffect, useRef, useState, type TransitionEvent } from "react";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from "lucide-react";

export interface PositionalTile {
  /** Ticker; its first two letters make the avatar */
  id: string;
  /** Company name shown under the avatar */
  name: string;
  /** Return %, e.g. "12.05" (blank shows an em dash) */
  returns?: string;
  /** Shown as-is after "Potential:" */
  potential: string;
  /** Shown as-is after "Period:" */
  period: string;
}

const TILE_W = 188;            // px
const GAP = 16;                // px
const COPIES = 6;              // identical copies of the list in the track (keeps the loop seamless while arrows nudge it)
const REPEAT = 2;              // list repeats inside one copy, so one copy is always wider than the viewport
const SECONDS_PER_TILE = 4.5;  // scroll speed: one tile every 4.5s

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

// The keyframes cycle the track from 2 to 3 copy-widths (2/6 -> 3/6 of the track), which looks identical at both ends.
const CSS = `
@keyframes tt-marquee { from { transform: translateX(-33.3333%); } to { transform: translateX(-50%); } }
.tt-track { display: flex; width: max-content; animation: tt-marquee linear infinite; will-change: transform; }
.tt-track[data-paused="true"] { animation-play-state: paused; }
.tt-viewport:has(:focus-visible) .tt-track { animation-play-state: paused; }  /* keyboard focus only: a tap or click also focuses a tile and must not leave the row stuck */
@media (hover: hover) { .tt-viewport:hover .tt-track { animation-play-state: paused; } }
@media (prefers-reduced-motion: reduce) { .tt-track { animation: none !important; } }
.tt-viewport { -webkit-mask-image: linear-gradient(to right, transparent, #000 20px, #000 calc(100% - 20px), transparent);
               mask-image: linear-gradient(to right, transparent, #000 20px, #000 calc(100% - 20px), transparent); }
`;

function ReturnBadge({ returns }: { returns?: string }) {
  const num = parseFloat((returns ?? "").replace(/[,%]/g, ""));
  if (!returns || returns.trim() === "" || isNaN(num)) {
    return (
      <div className="text-right shrink-0">
        <div className="flex items-center justify-end h-5 text-sm font-black text-white/50">—</div>
        <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Returns</div>
      </div>
    );
  }
  const pos = num > 0, neg = num < 0;
  return (
    <div className="text-right shrink-0">
      <div className={`flex items-center justify-end gap-0.5 h-5 text-sm font-black tracking-tight ${pos ? "text-emerald-400" : neg ? "text-rose-400" : "text-white/80"}`}>
        {pos && <TrendingUp className="w-3.5 h-3.5" />}
        {neg && <TrendingDown className="w-3.5 h-3.5" />}
        <span>{pos ? `+${num.toFixed(1)}%` : `${num.toFixed(1)}%`}</span>
      </div>
      <div className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Returns</div>
    </div>
  );
}

function Tile({ tile, decoy, onClick }: { tile: PositionalTile; decoy: boolean; onClick?: (t: PositionalTile) => void }) {
  return (
    <button
      type="button"
      tabIndex={decoy ? -1 : 0}
      onClick={() => onClick?.(tile)}
      style={{ width: TILE_W }}
      className="group snap-start shrink-0 min-h-[288px] flex flex-col items-center text-center bg-[#0b0f19]/90 border border-white/10 hover:border-cyan-400/40 rounded-2xl p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan-500/5 active:scale-[0.98] backdrop-blur-md"
    >
      <div className="w-full flex items-start justify-between gap-2">
        <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-bold text-cyan-300">Positional</span>
        <ReturnBadge returns={tile.returns} />
      </div>

      <div className="mt-4 w-16 h-16 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/15 flex items-center justify-center font-black text-lg text-white shadow-inner group-hover:border-cyan-400/50 transition-colors">
        {tile.id.slice(0, 2).toUpperCase()}
      </div>

      <h3 className="mt-3 text-sm font-black text-white leading-tight line-clamp-2 min-h-[2.5rem] group-hover:text-cyan-300 transition-colors">
        {tile.name}
      </h3>

      <div className="mt-auto w-full pt-3 border-t border-white/5 space-y-1 text-xs">
        <p className="text-muted-foreground font-semibold">
          Potential: <span className="font-mono font-bold text-emerald-400">{tile.potential}</span>
        </p>
        <p className="text-muted-foreground font-semibold">
          Period: <span className="font-bold text-white/90">{tile.period}</span>
        </p>
      </div>
    </button>
  );
}

/**
 * Auto-scrolling row of positional-trade tiles (CSS animation, no dependencies).
 * Pauses on hover / touch / keyboard focus, arrows nudge the row, and with
 * prefers-reduced-motion it becomes a normal swipe/arrow scroller.
 */
export function PositionalMarqueeStrip({ items, onTileClick }: { items: PositionalTile[]; onTileClick?: (t: PositionalTile) => void }) {
  const reduced = usePrefersReducedMotion();
  const viewportRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const [touching, setTouching] = useState(false);
  const touchTimer = useRef<number>();
  const [nudge, setNudge] = useState(0);        // px the arrows have shifted the row by
  const [instant, setInstant] = useState(false); // true while silently wrapping the nudge back into range
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  // Reduced-motion mode is a plain scroll container, so it tracks its scroll position for the arrows
  const updateArrows = () => {
    const el = viewportRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };
  useEffect(() => {
    if (!reduced) return;
    updateArrows();
    window.addEventListener("resize", updateArrows);
    return () => window.removeEventListener("resize", updateArrows);
  }, [reduced, items.length]);

  if (items.length === 0) return null;

  const stepPx = () => Math.max(TILE_W + GAP, (viewportRef.current?.clientWidth ?? 600) * 0.8);
  const scrollBy = (dir: 1 | -1) => {
    if (reduced) viewportRef.current?.scrollBy({ left: dir * stepPx(), behavior: "smooth" });
    else setNudge((n) => n - dir * stepPx()); // moving "right" pulls the row left
  };

  // After a nudge settles, shift it by whole copy-widths back near zero. Copies are identical, so nothing visibly moves.
  const wrapNudge = (e: TransitionEvent) => {
    if (e.target !== e.currentTarget) return;
    const copyWidth = copyRef.current?.offsetWidth ?? 0;
    if (!copyWidth) return;
    let m = nudge;
    while (m > copyWidth / 2) m -= copyWidth;
    while (m < -copyWidth / 2) m += copyWidth;
    if (m === nudge) return;
    setInstant(true);
    setNudge(m);
    requestAnimationFrame(() => requestAnimationFrame(() => setInstant(false)));
  };

  const onTouchStart = () => { window.clearTimeout(touchTimer.current); setTouching(true); };
  const onTouchEnd = () => { window.clearTimeout(touchTimer.current); touchTimer.current = window.setTimeout(() => setTouching(false), 1200); };

  const list = Array.from({ length: REPEAT }, () => items).flat();
  const seconds = list.length * SECONDS_PER_TILE;

  return (
    <div className="w-full">
      <style>{CSS}</style>

      <div className="flex items-center justify-end gap-1.5 sm:gap-2 mb-2">
        <button type="button" aria-label="Scroll left" onClick={() => scrollBy(-1)} disabled={reduced && !canLeft}
          className="hidden sm:flex w-7 h-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button type="button" aria-label="Scroll right" onClick={() => scrollBy(1)} disabled={reduced && !canRight}
          className="hidden sm:flex w-7 h-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {reduced ? (
        // prefers-reduced-motion: one static copy in a normal scroll container
        <div ref={viewportRef} onScroll={updateArrows} className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((t, i) => <Tile key={`${t.id}-${i}`} tile={t} decoy={false} onClick={onTileClick} />)}
        </div>
      ) : (
        <div ref={viewportRef} className="tt-viewport overflow-hidden pb-2" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onTouchCancel={onTouchEnd}>
          <div
            style={{ width: "max-content", transform: `translateX(${nudge}px)`, transition: instant ? "none" : "transform 500ms ease" }}
            onTransitionEnd={wrapNudge}
          >
            <div className="tt-track" data-paused={touching} style={{ animationDuration: `${seconds}s` }}>
              {Array.from({ length: COPIES }, (_, c) => (
                <div key={c} ref={c === 0 ? copyRef : undefined} aria-hidden={c > 0} className="flex shrink-0" style={{ gap: GAP, paddingRight: GAP }}>
                  {list.map((t, i) => <Tile key={`${t.id}-${i}`} tile={t} decoy={c > 0} onClick={onTileClick} />)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PositionalMarqueeStrip;
