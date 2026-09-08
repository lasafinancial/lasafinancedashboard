import { useLiveData } from "@/hooks/useLiveData";
import { useMemo } from "react";
import { Newspaper, Flame } from "lucide-react";
import { Link } from "react-router-dom";

export function NewsTicker() {
  const { dailyNews, isLoading } = useLiveData();

  const tickerItems = useMemo(() => {
    if (!dailyNews || dailyNews.length === 0) return [];
    
    // Sort by most recent or just use as is if already sorted
    // Assuming it's already sorted from the sheet
    return dailyNews.map(item => ({
      text: item.news,
      stock: item.stock,
      impact: item.impact
    }));
  }, [dailyNews]);

  if (isLoading || tickerItems.length === 0) {
    return null; // Do not render if no news or loading
  }

  return (
    <div className="w-full relative bg-white/5 border border-white/10 rounded-xl overflow-hidden shadow-lg backdrop-blur-sm flex items-center h-10 mb-6">
      {/* Label Box */}
      <div className="absolute left-0 z-20 h-full flex items-center bg-[#020617] px-3 border-r border-white/10 shadow-[4px_0_12px_rgba(0,0,0,0.5)]">
        <Link to="/daily-news" className="flex items-center gap-1.5 hover:text-primary transition-colors">
            <Newspaper className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-white uppercase tracking-wider hidden sm:inline">Latest News</span>
        </Link>
      </div>

      {/* Marquee Container */}
      <div className="flex-1 overflow-hidden h-full relative pl-[40px] sm:pl-[120px]">
        {/* Gradient overlays for smooth fade on edges */}
        <div className="absolute left-[40px] sm:left-[120px] top-0 w-8 h-full bg-gradient-to-r from-[#020617] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 w-12 h-full bg-gradient-to-l from-[#020617] to-transparent z-10 pointer-events-none" />
        
        {/* Scrolling Content */}
        <div className="flex items-center h-full w-max animate-marquee hover:[animation-play-state:paused]">
          <div className="flex shrink-0 items-center">
            {tickerItems.map((item, idx) => (
              <div key={idx} className="flex items-center mx-4 group cursor-pointer">
                {item.impact?.toLowerCase().includes("positive") && <Flame className="w-3.5 h-3.5 text-success mr-2 shrink-0" />}
                {item.impact?.toLowerCase().includes("negative") && <Flame className="w-3.5 h-3.5 text-destructive mr-2 shrink-0" />}
                
                <span className="text-sm font-medium text-white/90 group-hover:text-primary transition-colors whitespace-nowrap">
                  {item.stock ? <span className="font-bold text-white mr-1.5">{item.stock}:</span> : null}
                  {item.text}
                </span>
                
                <span className="mx-6 text-white/20">•</span>
              </div>
            ))}
          </div>
          
          {/* Duplicate set for seamless looping */}
          <div className="flex shrink-0 items-center">
            {tickerItems.map((item, idx) => (
              <div key={`dup-${idx}`} className="flex items-center mx-4 group cursor-pointer">
                {item.impact?.toLowerCase().includes("positive") && <Flame className="w-3.5 h-3.5 text-success mr-2 shrink-0" />}
                {item.impact?.toLowerCase().includes("negative") && <Flame className="w-3.5 h-3.5 text-destructive mr-2 shrink-0" />}
                
                <span className="text-sm font-medium text-white/90 group-hover:text-primary transition-colors whitespace-nowrap">
                  {item.stock ? <span className="font-bold text-white mr-1.5">{item.stock}:</span> : null}
                  {item.text}
                </span>
                
                <span className="mx-6 text-white/20">•</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
