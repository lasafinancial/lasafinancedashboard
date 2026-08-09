// Enhanced Screeners Page
import { Filter, ChevronDown, TrendingUp, ArrowUpRight, Search, Zap, Crosshair, BarChart2, Rocket, Activity } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { PremiumProtector } from "@/components/ui/PremiumProtector";
import { Link, useNavigate } from "react-router-dom";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const screenerOptions = [
    {
        path: "/screeners/intraday-dev",
        label: "Breakout Board",
        description: "Intraday status-based signals with real-time probability tracking and multi-tier analysis.",
        icon: BarChart2,
        color: "text-primary",
        bgColor: "bg-primary/10",
        borderColor: "group-hover:border-primary/50",
        gradient: "from-primary/20 to-transparent"
    },
    {
        path: "/screeners/near-resistance",
        label: "Near Resistance",
        description: "An algorithmic filter that highlights stocks approaching predefined algorithmic resistance levels in real time.",
        icon: TrendingUp,
        color: "text-emerald-400",
        bgColor: "bg-emerald-400/10",
        borderColor: "group-hover:border-emerald-400/50",
        gradient: "from-emerald-400/20 to-transparent"
    },
    {
        path: "/screeners/support-reversal",
        label: "Support Reversal",
        description: "An algorithmic filter that highlights stocks approaching predefined algorithmic support levels in real time.",
        icon: Zap,
        color: "text-blue-400",
        bgColor: "bg-blue-400/10",
        borderColor: "group-hover:border-blue-400/50",
        gradient: "from-blue-400/20 to-transparent"
    },
    {
        path: "/screeners/reaction-zone",
        label: "Reaction Zone",
        description: "An algorithmic filter that highlights stocks approaching any (Model, Pattern or Balance) of the predefined algorithmic levels in real time.",
        icon: Crosshair,
        color: "text-purple-400",
        bgColor: "bg-purple-400/10",
        borderColor: "group-hover:border-purple-400/50",
        gradient: "from-purple-400/20 to-transparent"
    },
    {
        path: "/screeners/intraday-breakout",
        label: "Intraday Volume Breakout",
        description: "High-intensity momentum breakouts with volume confirmation captured during the last two trading days.",
        icon: Rocket,
        color: "text-orange-400",
        bgColor: "bg-orange-400/10",
        borderColor: "group-hover:border-orange-400/50",
        gradient: "from-orange-400/20 to-transparent"
    },
    {
        path: "/screeners/intraday-reversal",
        label: "Intraday Reversal",
        description: "Live pullback-to-reversal detection using Heikin-Ashi analysis. Catches stocks reversing after an intraday breakout.",
        icon: Activity,
        color: "text-violet-400",
        bgColor: "bg-violet-400/10",
        borderColor: "group-hover:border-violet-400/50",
        gradient: "from-violet-400/20 to-transparent"
    },

    {
        path: "/screeners/obv-accumulation",
        label: "OBV Accumulation Scan",
        description: "Stocks whose On-Balance Volume shows daily breakout and weekly accumulation conditions.",
        icon: BarChart2,
        color: "text-emerald-400",
        bgColor: "bg-emerald-400/10",
        borderColor: "group-hover:border-emerald-400/50",
        gradient: "from-emerald-400/20 to-transparent"
    },
    {
        path: "/screeners/exit-target",
        label: "EXIT / TARGET SCREENER",
        description: "Dynamic tracking of target levels, buy prices, stoploss, and exit signals.",
        icon: Crosshair,
        color: "text-amber-400",
        bgColor: "bg-amber-400/10",
        borderColor: "group-hover:border-amber-400/50",
        gradient: "from-amber-400/20 to-transparent"
    }
    // Multibagger Hidden per boss request
    /* {
        path: "/multibagger",
        label: "Multibagger",
        description: "High growth potential stocks for long-term investing",
        icon: Rocket,
        color: "text-orange-400",
        bgColor: "bg-orange-400/10",
        borderColor: "group-hover:border-orange-400/50",
        gradient: "from-orange-400/20 to-transparent"
    } */
];

export function Screeners() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#020617] text-foreground selection:bg-primary/30">
            {/* Background Decor */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-1/3 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse delay-700" />
            </div>

            <div className="relative container mx-auto px-4 py-8 pb-20">
                {/* Screener Top Disclaimer */}
                <div className="mb-6 p-3 rounded-xl bg-primary/5 border border-primary/10 text-center">
                    <p className="text-[11px] md:text-xs text-muted-foreground/80 leading-relaxed font-medium capitalize">
                        Stocks shown are filtered based on the selected analytical criteria and do not constitute buy or sell recommendations. No ranking or prioritization is implied.
                    </p>
                </div>
                {/* Header */}
                <div className="mb-12 space-y-6 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-[0.2em]">
                        <Search className="w-3.5 h-3.5" />
                        Explore Opportunities
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-4xl md:text-7xl font-black tracking-tighter leading-none">
                            STOCK <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400">SCREENERS</span>
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-2xl">
                            Advanced algorithmic filters to identify high-probability trading setups in real-time.
                        </p>
                    </div>
                </div>

                {/* Screener Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {screenerOptions.map((option) => {
                        const Icon = option.icon;
                        const isPremiumScreener = option.label === "Reaction Zone" || option.label === "Intraday Volume Breakout";

                        const CardContent = (
                            <Link key={option.path} to={option.path} className="group h-full block">
                                <GlassCard className={`relative p-6 h-full flex flex-col justify-between overflow-hidden transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-2xl border-white/5 ${option.borderColor}`}>

                                    {/* Hover Gradient Background */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${option.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

                                    <div className="relative z-10">
                                        <div className="flex items-start justify-between mb-6">
                                            <div className={`p-4 rounded-2xl ${option.bgColor} ${option.color} ring-1 ring-white/10 group-hover:scale-110 transition-transform duration-300`}>
                                                <Icon className="w-8 h-8" />
                                            </div>
                                            <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                                                <ArrowUpRight className={`w-5 h-5 text-muted-foreground group-hover:text-white transition-colors`} />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <h3 className={`text-xl font-bold uppercase tracking-tight ${option.color} drop-shadow-sm`}>
                                                {option.label}
                                            </h3>
                                            <p className="text-sm text-muted-foreground/80 leading-relaxed group-hover:text-muted-foreground transition-colors">
                                                {option.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="relative z-10 mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-medium text-muted-foreground/60 uppercase tracking-wider group-hover:text-muted-foreground transition-colors">
                                        <span>View Screener</span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                    </div>
                                </GlassCard>
                            </Link>
                        );

                        return (
                            <PremiumProtector key={option.path} requiredTier="pro">
                                {CardContent}
                            </PremiumProtector>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default Screeners;