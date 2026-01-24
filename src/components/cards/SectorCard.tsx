import { TrendingUp, TrendingDown } from "lucide-react";

interface Stock {
  name: string;
  symbol: string;
  support: number;
  resistance: number;
}

interface SectorCardProps {
  sectorName: string;
  stocks: Stock[];
  icon: React.ReactNode;
  accentColor: string;
}

const SectorCard = ({ sectorName, stocks, icon, accentColor }: SectorCardProps) => {
  return (
    <div className="glass-card-hover overflow-hidden group">
      {/* Header */}
      <div 
        className="p-4 border-b border-border/50 flex items-center gap-3"
        style={{ 
          background: `linear-gradient(135deg, ${accentColor}10, transparent)`,
        }}
      >
        <div 
          className="p-2 rounded-lg"
          style={{ backgroundColor: `${accentColor}20` }}
        >
          {icon}
        </div>
        <div>
          <h3 className="font-semibold">{sectorName}</h3>
          <p className="text-xs text-muted-foreground">{stocks.length} stocks</p>
        </div>
      </div>

      {/* Stock list */}
        <div className="divide-y divide-border/30">
          {stocks.map((stock, index) => (
            <div 
              key={stock.symbol} 
              className="p-2 hover:bg-muted/30 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <div>
                  <p className="font-medium text-sm">{stock.name}</p>
                  {stock.name !== stock.symbol && (
                    <p className="text-xs text-muted-foreground font-mono">{stock.symbol}</p>
                  )}
                </div>
              </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3 text-success" />
                <span className="text-muted-foreground">Support:</span>
                <span className="font-mono font-medium text-success">₹{stock.support}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingDown className="w-3 h-3 text-destructive" />
                <span className="text-muted-foreground">Resistance:</span>
                <span className="font-mono font-medium text-destructive">₹{stock.resistance}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SectorCard;
