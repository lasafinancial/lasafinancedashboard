import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useState } from "react";

interface StockStrengthZoneProps {
  data?: any[];
}

const StockStrengthZone = ({ data = [] }: StockStrengthZoneProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const getZoneData = (row: any) => {
    const support = row.support;
    const resistance = row.resistance;
    const price = row.price;
    
    if (!support || !resistance || !price) return null;
    
    const range = resistance - support;
    const padding = range * 0.5;
    const rangeMin = Math.round(support - padding);
    const rangeMax = Math.round(resistance + padding);
    const totalRange = rangeMax - rangeMin;
    
    const supportPos = ((support - rangeMin) / totalRange) * 100;
    const resistancePos = ((resistance - rangeMin) / totalRange) * 100;
    const pricePos = Math.max(2, Math.min(98, ((price - rangeMin) / totalRange) * 100));
    
    return { support, resistance, price, rangeMin, rangeMax, supportPos, resistancePos, pricePos };
  };

  const reversedData = [...data].reverse();

  return (
    <div className="glass-card overflow-hidden animate-fade-in-up">
      <div className="px-4 py-3 border-b border-border/50">
        <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Strength Zone</h3>
              <p className="text-xs text-muted-foreground">Price shown on marker</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-3 rounded-sm bg-cyan-500/40 border border-cyan-500"></div>
                <span className="text-muted-foreground">Weak-Strong Zone</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                <span className="text-muted-foreground">Price</span>
              </div>
            </div>
        </div>
      </div>
    
      <div className="p-4 space-y-1">
        {reversedData.map((row, index) => {
          const zoneData = getZoneData(row);
          if (!zoneData) return null;
          
          const isHovered = hoveredIndex === index;
          
          return (
            <div key={`${row.date}-${index}`} className="py-3">
              <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold min-w-[70px]">{row.date}</span>
                    {String(row.resistanceSlopeDownward).toLowerCase() === 'true' ? (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    ) : String(row.resistanceSlopeDownward).toLowerCase() === 'false' ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <Minus className="w-4 h-4 text-muted-foreground" />
                    )}
                </div>
              
              <div className="relative h-6 mx-2">
                <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-muted-foreground/30 -translate-y-1/2" />
                
                <div className="absolute top-1/2 left-0 w-[2px] h-3 bg-muted-foreground/50 -translate-y-1/2" />
                <div className="absolute top-1/2 right-0 w-[2px] h-3 bg-muted-foreground/50 -translate-y-1/2" />
                
                <div 
                  className="absolute top-1/2 -translate-y-1/2 h-5 bg-cyan-500/30 border-l-2 border-r-2 border-cyan-500 rounded-sm"
                  style={{ 
                    left: `${zoneData.supportPos}%`, 
                    width: `${zoneData.resistancePos - zoneData.supportPos}%` 
                  }}
                />
                
                <div 
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-pointer z-10"
                    style={{ left: `${zoneData.pricePos}%` }}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                      <div className={`w-3 h-3 rounded-full bg-amber-400 border-2 border-background shadow-lg transition-transform ${isHovered ? 'scale-150' : ''}`} />
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs font-mono px-2 py-1 rounded whitespace-nowrap z-20 flex flex-col items-center">
                        <span className="opacity-70 text-[10px]">{row.date}</span>
                        <span>₹{zoneData.price.toLocaleString()}</span>
                      </div>
                  </div>
              </div>
              
              <div className="relative mt-1 mx-2 h-4">
                <span className="absolute left-0 text-[10px] font-mono text-muted-foreground">
                  {zoneData.rangeMin.toLocaleString()}
                </span>
                  <span 
                    className="absolute text-[10px] font-mono text-cyan-400 -translate-x-1/2"
                    style={{ left: `${zoneData.supportPos}%` }}
                  >
                    W:{zoneData.support.toLocaleString()}
                  </span>
                  <span 
                    className="absolute text-[10px] font-mono text-cyan-400 -translate-x-1/2"
                    style={{ left: `${zoneData.resistancePos}%` }}
                  >
                    S:{zoneData.resistance.toLocaleString()}
                  </span>
                <span className="absolute right-0 text-[10px] font-mono text-muted-foreground">
                  {zoneData.rangeMax.toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StockStrengthZone;
