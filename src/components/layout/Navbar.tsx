import { Link, useLocation } from "react-router-dom";
import { Search, Grid3X3, BarChart3, Rocket, FlaskConical, Bell, BellOff, Loader2, Send, Filter, ChevronDown, Menu, MessageSquare, HelpCircle, TrendingUp, Newspaper } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useNotifications } from "@/hooks/useNotifications";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { CountrySelector } from "@/components/ui/CountrySelector";
import type { CountryId } from "@/components/ui/CountrySelectionModal";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Crown, Shield } from "lucide-react";

interface NavbarProps {
  selectedCountry: CountryId | null;
  onCountryChange: (countryId: CountryId) => void;
}

const Navbar = ({ selectedCountry, onCountryChange }: NavbarProps) => {
  const location = useLocation();
  const { user, userData, logout } = useAuth();
  const { isEnabled, isLoading, isSupported, toggleNotifications } = useNotifications();
  const [isSending, setIsSending] = useState(false);
  const [isScreenersOpen, setIsScreenersOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  let closeTimeout: NodeJS.Timeout;

  const handleMouseEnter = () => {
    clearTimeout(closeTimeout);
    setIsScreenersOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimeout = setTimeout(() => {
      setIsScreenersOpen(false);
    }, 300);
  };

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
    { path: "/stocks", label: "Stocks", icon: Search },
    { path: "/nifty50", label: "NIFTY", icon: TrendingUp },
    { path: "/daily-news", label: "News", icon: Newspaper },
    { path: "/screeners", label: "Screeners", icon: Filter },
    { path: "/help", label: "Help", icon: HelpCircle },
  ];

  return (
    <nav className="sticky top-0 z-[100] border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full group-hover:bg-primary/30 transition-colors" />
              <img src="/complogo.png" alt="LASA Logo" className="relative h-8 w-8 object-contain" />
            </div>
            <span className="text-xl font-bold gradient-text">LASA FINANCE</span>
          </Link>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path ||
                (item.path === "/screeners" && location.pathname.startsWith("/screeners"));

              if (item.path === "/screeners") {
                return (
                  <div
                    key={item.path}
                    className="relative"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  >
                    <button
                      className={`nav-link flex items-center gap-2 ${isActive ? "active" : ""}`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{item.label}</span>
                      <ChevronDown className={`h-3 w-3 opacity-50 transition-transform ${isScreenersOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <div className={`absolute top-[calc(100%+2px)] left-0 min-w-[220px] p-2 bg-background/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl transition-all duration-200 z-[150] ${isScreenersOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
                      <div className="absolute -top-2 left-0 w-full h-2 bg-transparent" /> { /* Bridge the gap */}
                      <Link
                        to="/screeners/intraday-dev"
                        onClick={() => setIsScreenersOpen(false)}
                        className="block px-3 py-2.5 rounded-lg hover:bg-primary/10 transition-colors group/item text-left"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">Breakout Board</span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Status Based</span>
                        </div>
                      </Link>
                      <Link
                        to="/screeners/near-resistance"
                        onClick={() => setIsScreenersOpen(false)}
                        className="block px-3 py-2.5 rounded-lg hover:bg-primary/10 transition-colors group/item mt-1 text-left"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">Breakout</span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Bullish Setups</span>
                        </div>
                      </Link>
                      <Link
                        to="/screeners/support-reversal"
                        onClick={() => setIsScreenersOpen(false)}
                        className="block px-3 py-2.5 rounded-lg hover:bg-primary/10 transition-colors group/item mt-1 text-left"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">Reversal</span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Potential Reversals</span>
                        </div>
                      </Link>
                      <Link
                        to="/screeners/reaction-zone"
                        onClick={() => setIsScreenersOpen(false)}
                        className="block px-3 py-2.5 rounded-lg hover:bg-primary/10 transition-colors group/item mt-1 text-left"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">Reaction Zone</span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Algo Level Proximity</span>
                        </div>
                      </Link>
                      <Link
                        to="/screeners/intraday-breakout"
                        onClick={() => setIsScreenersOpen(false)}
                        className="block px-3 py-2.5 rounded-lg hover:bg-primary/10 transition-colors group/item mt-1 text-left"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">Intraday Breakout</span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Breakout Momentum</span>
                        </div>
                      </Link>
                      <Link
                        to="/screeners/nifty-analysis"
                        onClick={() => setIsScreenersOpen(false)}
                        className="block px-3 py-2.5 rounded-lg hover:bg-primary/10 transition-colors group/item mt-1 text-left"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">Optics</span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Nifty Options</span>
                        </div>
                      </Link>
                      {user?.email === 'lasafinancial@gmail.com' ? (
                        <Link
                          to="/multibagger"
                          className="block px-3 py-2.5 rounded-lg hover:bg-primary/10 transition-colors group/item mt-1 text-left"
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold">Dev-MB</span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">High Growth Picks</span>
                          </div>
                        </Link>
                      ) : (
                        <button
                          onClick={() => toast({ title: "Coming Soon", description: "Dev-MB section is under active development!" })}
                          className="w-full block px-3 py-2.5 rounded-lg hover:bg-primary/10 transition-colors group/item mt-1 text-left"
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold">Dev-MB</span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">High Growth Picks</span>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                );
              }

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

          <div className="hidden md:flex items-center gap-4">
            {/* Live Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
              </span>
              <span className="text-xs font-medium text-success uppercase tracking-wider">Live</span>
            </div>

            {/* Country Selector */}
            <CountrySelector
              selectedCountry={selectedCountry || 'india'}
              onCountryChange={onCountryChange}
            />

            {/* Notification Toggle */}
            {isSupported && (
              <button
                onClick={toggleNotifications}
                disabled={isLoading}
                className={`relative p-2 rounded-lg transition-all duration-200 ${isEnabled
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

            <ThemeToggle />

            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-auto px-2 flex items-center gap-2 hover:bg-white/5 group border border-white/5 rounded-xl">
                  <div className="h-7 w-7 rounded-lg bg-primary/20 flex items-center justify-center ring-1 ring-primary/40">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="hidden lg:flex flex-col items-start gap-0.5">
                    <span className="text-sm font-semibold truncate max-w-[100px]">
                      {userData?.name || "User"}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-tight">
                      {userData?.tier === 'pro' ? 'Pro Member' : 'Free Tier'}
                    </span>
                  </div>
                  <ChevronDown className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mt-2 bg-background/95 backdrop-blur-xl border-white/10" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userData?.name || "User"}</p>
                    <p className="text-xs leading-none text-muted-foreground truncate max-w-[180px]">
                      {user?.email || user?.phoneNumber || "No contact info"}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                {(user?.email === 'm.tharan@bcah.christuniversity.in' || user?.email === 'lasafinancial@gmail.com' || user?.phoneNumber === '+919555151691' || user?.phoneNumber === '919555151691') && (
                  <>
                    <Link to="/pricing">
                      <DropdownMenuItem className="focus:bg-primary/10 cursor-pointer py-2.5">
                        <User className="mr-2 h-4 w-4" />
                        <span>Account Profile</span>
                      </DropdownMenuItem>
                    </Link>
                    <Link to="/pricing">
                      <DropdownMenuItem
                        className="focus:bg-success/10 cursor-pointer py-2.5 text-success font-medium"
                      >
                        <Crown className="mr-2 h-4 w-4" />
                        <span>Upgrade to Pro</span>
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuSeparator className="bg-white/10" />
                  </>
                )}

                {/* Admin Quick Action (previously static buttons) */}
                <DropdownMenuItem
                  className="focus:bg-white/5 cursor-pointer py-2.5"
                  onClick={() => toast({ title: "Feedback", description: "Coming Soon! We'd love to hear from you." })}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  <span>Feedback</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem className="focus:bg-destructive/10 text-destructive cursor-pointer py-2.5" onClick={() => logout()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden flex items-center gap-2">
            {/* Mobile Quick Links */}
            <div className="flex items-center gap-1 mr-1">
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className={`p-2 rounded-xl transition-colors ${location.pathname === "/" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>
                <BarChart3 className="h-5 w-5" />
              </Link>
              <Link to="/stocks" onClick={() => setIsMobileMenuOpen(false)} className={`p-2 rounded-xl transition-colors ${location.pathname === "/stocks" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>
                <Search className="h-5 w-5" />
              </Link>
              <Link to="/screeners" onClick={() => setIsMobileMenuOpen(false)} className={`p-2 rounded-xl transition-colors ${location.pathname.startsWith("/screeners") ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>
                <Filter className="h-5 w-5" />
              </Link>
            </div>

            {/* Live Indicator Mobile */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-success/10 border border-success/20">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success" />
              </span>
              <span className="text-[10px] font-medium text-success uppercase tracking-wider">Live</span>
            </div>

            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-white/5">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[55vw] sm:w-[350px] p-6 pt-10 border-l border-white/10 bg-[#060606] overflow-y-auto">
                <div className="flex flex-col min-h-full gap-6 pb-8">
                  {/* Mobile Nav Links */}
                  <div className="flex flex-col gap-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Menu</h3>
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path ||
                        (item.path === "/screeners" && location.pathname.startsWith("/screeners"));

                      if (item.path === "/screeners") {
                        return (
                          <div key={item.path} className="space-y-1">
                            <Link
                              to="/screeners"
                              onClick={() => setIsMobileMenuOpen(false)}
                              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"}`}
                            >
                              <Icon className="h-5 w-5" />
                              <span className="font-medium">Screeners</span>
                            </Link>
                            <div className="pl-12 space-y-1 border-l border-white/5 ml-6">
                              <Link to="/screeners/intraday-dev" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-2 text-sm text-muted-foreground hover:text-primary transition-colors">Breakout Board</Link>
                              <Link to="/screeners/near-resistance" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-2 text-sm text-muted-foreground hover:text-primary transition-colors">Breakout</Link>
                              <Link to="/screeners/support-reversal" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-2 text-sm text-muted-foreground hover:text-primary transition-colors">Reversal</Link>
                              <Link to="/screeners/reaction-zone" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-2 text-sm text-muted-foreground hover:text-primary transition-colors">Reaction Zone</Link>
                              <Link to="/screeners/intraday-breakout" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-2 text-sm text-muted-foreground hover:text-primary transition-colors">Intraday Breakout</Link>
                              <Link to="/screeners/nifty-analysis" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-2 text-sm text-muted-foreground hover:text-primary transition-colors">Optics</Link>
                              {user?.email === 'lasafinancial@gmail.com' ? (
                                <Link to="/multibagger" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-2 text-sm text-muted-foreground hover:text-primary transition-colors">Dev-MB</Link>
                              ) : (
                                <button
                                  onClick={() => {
                                    setIsMobileMenuOpen(false);
                                    toast({ title: "Coming Soon", description: "Dev-MB section is under active development!" });
                                  }}
                                  className="w-full block px-4 py-2 text-sm text-muted-foreground hover:text-primary transition-colors text-left"
                                >
                                  Dev-MB
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"}`}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="font-medium">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>

                  <div className="h-px bg-white/10 my-2" />

                  {/* Mobile Actions */}
                  <div className="flex flex-col gap-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Settings & Actions</h3>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Theme</span>
                      <ThemeToggle />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Region</span>
                      <CountrySelector
                        selectedCountry={selectedCountry || 'india'}
                        onCountryChange={onCountryChange}
                        showNameOnMobile={true}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Notifications</span>
                      {isSupported && (
                        <button
                          onClick={toggleNotifications}
                          disabled={isLoading}
                          className={`relative p-2 rounded-lg transition-all duration-200 ${isEnabled
                            ? 'bg-primary/10 border border-primary/20 text-primary'
                            : 'bg-white/5 border border-white/10 text-muted-foreground'
                            }`}
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : isEnabled ? (
                            <Bell className="h-4 w-4" />
                          ) : (
                            <BellOff className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Feedback</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toast({ title: "Feedback", description: "Coming Soon! We'd love to hear from you." })}
                        className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="h-px bg-white/10 my-2" />

                    <Button
                      variant="destructive"
                      className="w-full justify-start gap-3 h-11 rounded-xl"
                      onClick={() => logout()}
                    >
                      <LogOut className="h-5 w-5" />
                      <span>Logout</span>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
