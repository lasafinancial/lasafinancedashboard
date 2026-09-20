import { PositionalMarqueeStrip, type PositionalTile } from "@/components/cards/PositionalMarqueeStrip";

/**
 * Preview only: hardcoded sample data, not linked from anywhere.
 * Tickers, names and numbers are fictional.
 */
const SAMPLE_TILES: PositionalTile[] = [
  { id: "ACMEPOWER", name: "Acme Power & Infrastructure Ltd", returns: "12.05", potential: "+28.26%", period: "upto 1 year" },
  { id: "NOVABANK", name: "Nova Bank Ltd", returns: "4.2", potential: "+22.10%", period: "upto 1 year" },
  { id: "ZENITHPHARMA", name: "Zenith Pharmaceuticals Ltd", returns: "-1.9", potential: "+31.75%", period: "upto 1 year" },
  { id: "ORIONAUTO", name: "Orion Automotive Components Ltd", returns: "1.04", potential: "+18.40%", period: "upto 9 months" },
  { id: "HELIXTEXTILES", name: "Helix Textiles Ltd", returns: "", potential: "+25.00%", period: "upto 1 year" },
  { id: "POLARSTEEL", name: "Polar Steel & Alloys Ltd", returns: "0", potential: "+35.60%", period: "upto 6 months" },
];

export default function TradeTilesPreview() {
  return (
    <div className="min-h-screen bg-[#020617] text-foreground font-sans pb-16">
      <div className="relative container mx-auto px-4 py-8 max-w-7xl space-y-6">
        <div className="px-3 py-2 rounded-lg border border-dashed border-cyan-400/40 bg-cyan-500/5 text-[11px] font-bold text-cyan-300 uppercase tracking-wider">
          Preview · hardcoded sample data · fictional tickers · not a real recommendation
        </div>

        <div className="flex items-center gap-2.5 px-1">
          <div className="relative flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
            <div className="absolute w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping opacity-75" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight text-white leading-tight">Latest Positional Trades</h2>
            <p className="text-[11px] text-muted-foreground/70 font-semibold">Hover or touch to pause · arrows to nudge</p>
          </div>
        </div>

        <PositionalMarqueeStrip items={SAMPLE_TILES} onTileClick={(t) => console.log("tile clicked:", t.id)} />
      </div>
    </div>
  );
}
