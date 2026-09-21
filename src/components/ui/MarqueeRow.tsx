import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type TransitionEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const COPIES = 6;   // identical copies of the list in the track (keeps the loop seamless while the arrows nudge it)
const REPEAT = 2;   // the list repeats inside one copy, so one copy is always wider than the viewport
const GAP = 16;     // px between tiles
const DEFAULT_SPEED = 40; // px per second

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
@keyframes mq-marquee { from { transform: translateX(-33.3333%); } to { transform: translateX(-50%); } }
.mq-track { display: flex; width: max-content; animation: mq-marquee linear infinite; will-change: transform; }
.mq-track[data-paused="true"] { animation-play-state: paused; }
.mq-viewport:has(:focus-visible) .mq-track { animation-play-state: paused; }  /* keyboard focus only: a tap or click also focuses a tile and must not leave the row stuck */
@media (hover: hover) { .mq-viewport:hover .mq-track { animation-play-state: paused; } }
@media (prefers-reduced-motion: reduce) { .mq-track { animation: none !important; } }
.mq-viewport { -webkit-mask-image: linear-gradient(to right, transparent, #000 20px, #000 calc(100% - 20px), transparent);
               mask-image: linear-gradient(to right, transparent, #000 20px, #000 calc(100% - 20px), transparent); }
`;

const ARROW_CLASS =
  "hidden sm:flex w-7 h-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors";

interface MarqueeRowProps<T> {
  items: T[];
  getKey: (item: T, index: number) => string;
  /** Renders one tile. `decoy` is true for the extra copies, which must not be keyboard-focusable. */
  renderItem: (item: T, ctx: { decoy: boolean }) => ReactNode;
  /** Left side of the top row (title etc.) */
  header: ReactNode;
  /** Right side of the top row, after the arrows (e.g. a "View All" button) */
  trailing?: ReactNode;
  /** Optional wrapper around the scrolling row only (e.g. a premium gate) */
  wrapRow?: (row: ReactNode) => ReactNode;
  /** Scroll speed in px per second */
  speed?: number;
}

/**
 * A continuously scrolling row of tiles, like the ticker at the top of the page.
 * Pure CSS animation; loops seamlessly; pauses on hover, touch and keyboard focus;
 * the arrows nudge the row; with prefers-reduced-motion it is a normal swipe/arrow scroller.
 */
export function MarqueeRow<T>({ items, getKey, renderItem, header, trailing, wrapRow, speed = DEFAULT_SPEED }: MarqueeRowProps<T>) {
  const reduced = usePrefersReducedMotion();
  const viewportRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const touchTimer = useRef<number>();
  const [touching, setTouching] = useState(false);
  const [nudge, setNudge] = useState(0);         // px the arrows have shifted the row by
  const [instant, setInstant] = useState(false); // true while silently wrapping the nudge back into range
  const [copyWidth, setCopyWidth] = useState(0);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  // Keep the loop speed constant in px/s whatever the tile width, and re-measure on resize
  useLayoutEffect(() => {
    const el = copyRef.current;
    if (!el) return;
    const update = () => setCopyWidth(el.offsetWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [reduced, items.length]);

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

  useEffect(() => () => window.clearTimeout(touchTimer.current), []);

  if (items.length === 0) return null;

  const stepPx = () => Math.max(240, (viewportRef.current?.clientWidth ?? 600) * 0.8);
  const scrollBy = (dir: 1 | -1) => {
    if (reduced) viewportRef.current?.scrollBy({ left: dir * stepPx(), behavior: "smooth" });
    else setNudge((n) => n - dir * stepPx()); // moving "right" pulls the row left
  };

  // After a nudge settles, shift it by whole copy-widths back near zero. Copies are identical, so nothing visibly moves.
  const wrapNudge = (e: TransitionEvent) => {
    if (e.target !== e.currentTarget || !copyWidth) return;
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
  const seconds = copyWidth > 0 ? copyWidth / speed : list.length * 6;

  const row = reduced ? (
    // prefers-reduced-motion: one static copy in a normal scroll container
    <div ref={viewportRef} onScroll={updateArrows} className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {items.map((t, i) => <div key={getKey(t, i)} className="snap-start shrink-0">{renderItem(t, { decoy: false })}</div>)}
    </div>
  ) : (
    <div ref={viewportRef} className="mq-viewport overflow-hidden pb-2" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onTouchCancel={onTouchEnd}>
      <div
        style={{ width: "max-content", transform: `translateX(${nudge}px)`, transition: instant ? "none" : "transform 500ms ease" }}
        onTransitionEnd={wrapNudge}
      >
        <div className="mq-track" data-paused={touching} style={{ animationDuration: `${seconds}s` }}>
          {Array.from({ length: COPIES }, (_, c) => (
            <div key={c} ref={c === 0 ? copyRef : undefined} aria-hidden={c > 0} className="flex shrink-0" style={{ gap: GAP, paddingRight: GAP }}>
              {list.map((t, i) => <div key={getKey(t, i)}>{renderItem(t, { decoy: c > 0 })}</div>)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full space-y-3">
      <style>{CSS}</style>

      <div className="flex items-center justify-between px-1">
        {header}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button type="button" aria-label="Scroll left" onClick={() => scrollBy(-1)} disabled={reduced && !canLeft} className={ARROW_CLASS}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button type="button" aria-label="Scroll right" onClick={() => scrollBy(1)} disabled={reduced && !canRight} className={ARROW_CLASS}>
            <ChevronRight className="w-4 h-4" />
          </button>
          {trailing}
        </div>
      </div>

      {wrapRow ? wrapRow(row) : row}
    </div>
  );
}

export default MarqueeRow;
