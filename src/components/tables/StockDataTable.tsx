
interface StockDataTableProps {
  data?: any[];
}

const StockDataTable = ({ data = [] }: StockDataTableProps) => {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "Bullish":
        return <TrendingUp className="w-4 h-4 text-success" />;
      case "Bearish":
        return <TrendingDown className="w-4 h-4 text-destructive" />;
      default:
        return <Minus className="w-4 h-4 text-warning" />;
    }
  };

  const getTrendClass = (trend: string) => {
    switch (trend) {
      case "Bullish":
        return "text-success bg-success/10";
      case "Bearish":
        return "text-destructive bg-destructive/10";
      default:
        return "text-warning bg-warning/10";
    }
  };

  return (
    <div className="glass-card overflow-hidden animate-fade-in-up">
      <div className="p-4 border-b border-border/50">
        <h3 className="text-lg font-semibold">Technical Analysis Data</h3>
      </div>
      
      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Close</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Support</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resistance</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">RSI</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trend</th>
              </tr>
            </thead>
              <tbody>
                {[...data].reverse().map((row, index) => (
                  <tr 
                    key={`${row.date}-${index}`} 
                    className="table-row-hover border-b border-border/30 last:border-b-0"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <td className="px-4 py-3 font-mono text-sm">{row.date}</td>
                  <td className="px-4 py-3 text-right font-mono text-sm font-medium">₹{row.price?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono text-sm text-success">{row.lower?.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-mono text-sm text-destructive">{row.upper?.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-mono text-sm px-2 py-0.5 rounded ${
                      row.rsi > 70 ? 'text-destructive bg-destructive/10' :
                      row.rsi < 30 ? 'text-success bg-success/10' :
                      'text-warning bg-warning/10'
                    }`}>
                      {row.rsi?.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${row.trend === 'UP' ? 'text-success bg-success/10' : row.trend === 'DOWN' ? 'text-destructive bg-destructive/10' : 'text-warning bg-warning/10'}`}>
                        {row.trend}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>

        </table>
      </div>
    </div>
  );
};

export default StockDataTable;
