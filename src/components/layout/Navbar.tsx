import { Link, useLocation } from "react-router-dom";
import { TrendingUp, Search, Grid3X3, BarChart3, Rocket, FlaskConical } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

const Navbar = () => {
  const location = useLocation();

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
            
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
};


export default Navbar;
