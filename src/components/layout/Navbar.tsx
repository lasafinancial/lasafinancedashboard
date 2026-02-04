import { Link, useLocation } from "react-router-dom";
import { TrendingUp, Search, Grid3X3, BarChart3, Rocket, FlaskConical, Bell, BellOff, Loader2, Send } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useNotifications } from "@/hooks/useNotifications";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

const Navbar = () => {
  const location = useLocation();
  const { isEnabled, isLoading, isSupported, toggleNotifications } = useNotifications();
  const [isSending, setIsSending] = useState(false);

  // Admin: Manual trigger for market mood notification
  const sendMarketMoodNotification = async () => {
    setIsSending(true);
    try {
      const response = await fetch('/api/send-market-mood', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Notification Sent!',
          description: `${data.notification.body} - Sent to ${data.notification.successCount} users`,
        });
      } else {
        throw new Error(data.message || 'Failed to send');
      }
    } catch (error) {
      toast({
        title: 'Failed to Send',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const navItems = [
    { path: "/", label: "Dashboard", icon: BarChart3 },
    { path: "/stocks", label: "Stock Analysis", icon: Search },
    { path: "/sectors", label: "Sectors", icon: Grid3X3 },
    { path: "/multibagger", label: "Multibagger", icon: Rocket },
    { path: "/backtests", label: "Backtests", icon: FlaskConical },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full group-hover:bg-primary/30 transition-colors" />
              <TrendingUp className="relative h-8 w-8 text-primary" />
            </div>
            <span className="text-xl font-bold gradient-text">LASA FINANCE</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-link flex items-center gap-2 ${isActive ? "active" : ""}`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>

            <div className="flex items-center gap-4">
              {/* Live Indicator */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                </span>
                <span className="text-xs font-medium text-success uppercase tracking-wider">Live</span>
              </div>

              {/* Notification Toggle */}
              {isSupported && (
                <button
                  onClick={toggleNotifications}
                  disabled={isLoading}
                  className={`relative p-2 rounded-lg transition-all duration-200 ${
                    isEnabled 
                      ? 'bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20' 
                      : 'bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/10 hover:text-foreground'
                  }`}
                  title={isEnabled ? 'Disable notifications' : 'Enable notifications'}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isEnabled ? (
                    <Bell className="h-4 w-4" />
                  ) : (
                    <BellOff className="h-4 w-4" />
                  )}
                  {isEnabled && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                    </span>
                  )}
                </button>
              )}

              {/* Admin: Send Market Mood Button */}
              <button
                onClick={sendMarketMoodNotification}
                disabled={isSending}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-muted-foreground hover:bg-success/10 hover:border-success/20 hover:text-success transition-all duration-200"
                title="Send Market Mood Notification to All Users"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
              
              <ThemeToggle />
            </div>
        </div>
      </div>
    </nav>
  );
};


export default Navbar;
