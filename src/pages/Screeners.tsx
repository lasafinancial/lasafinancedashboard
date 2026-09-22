import { Filter, ChevronDown, TrendingUp, TrendingDown, ArrowUpRight, Search, Zap, Crosshair, BarChart2, Rocket, Activity, Calendar } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { PremiumProtector } from "@/components/ui/PremiumProtector";
import { Link, useNavigate } from "react-router-dom";
import { FEATURE_FLAGS } from "@/lib/featureFlags";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const screenerOptions = [
    {
        path: "/screeners/recommendations",
        label: "Short Term Trades",
        description: "Holding 1–4 Weeks. Short term swing trades tracking buy prices, targets, stoploss, and exit signals.",
        icon: Crosshair,
        color: "text-amber-400",
        bgColor: "bg-amber-400/10",
        borderColor: "group-hover:border-amber-400/50",
        gradient: "from-amber-400/20 to-transparent",
        isPaid: true
    },
    {
        path: "/screeners/weekly-recommendations",
        label: "Positional Trades",
        description: "Holding 2–6 Months. Positional setups tracking entry levels, current prices, target returns, and technical summaries.",
        icon: Calendar,
        color: "text-cyan-400",
        bgColor: "bg-cyan-400/10",
        borderColor: "group-hover:border-cyan-400/50",
        gradient: "from-cyan-400/20 to-transparent",
        isPaid: true
    },
    {
        path: "/screeners/52-week-high",
        label: "52 Week High",
        description: "Stocks currently trading within 5% of their 52-week high with structural support and resistance levels.",
        icon: TrendingUp,
        color: "text-emerald-400",
        bgColor: "bg-emerald-400/10",
        borderColor: "group-hover:border-emerald-400/50",
        gradient: "from-emerald-400/20 to-transparent",
        isPaid: false
    },
    {
        path: "/screeners/52-week-low",
        label: "52 Week Low",
        description: "Stocks currently trading within 5% of their 52-week low with structural support and resistance levels.",
        icon: TrendingDown,
        color: "text-rose-400",
        bgColor: "bg-rose-400/10",
        borderColor: "group-hover:border-rose-400/50",
        gradient: "from-rose-400/20 to-transparent",
        isPaid: false
    },
    {
        path: "/screeners/intraday-breakout",
        label: "Intraday Volume Breakout",
        description: "High-intensity momentum breakouts with volume confirmation captured during recent trading days.",
        icon: Rocket,
        color: "text-orange-400",
        bgColor: "bg-orange-400/10",
        borderColor: "group-hover:border-orange-400/50",
        gradient: "from-orange-400/20 to-transparent",
        isPaid: false
    },
    {
        path: "/screeners/intraday-reversal",
        label: "Intraday Reversal",
        description: "Live pullback-to-reversal detection using Heikin-Ashi analysis. Catches stocks reversing after an intraday breakout.",
        icon: Activity,
        color: "text-violet-400",
        bgColor: "bg-violet-400/10",
        borderColor: "group-hover:border-violet-400/50",
        gradient: "from-violet-400/20 to-transparent",
        isPaid: false
    },
    {
        path: "/screeners/obv-accumulation",
        label: "Accumulation Scan",
        description: "Stocks whose On-Balance Volume shows daily breakout and weekly accumulation conditions.",
        icon: BarChart2,
        color: "text-teal-400",
        bgColor: "bg-teal-400/10",
        borderColor: "group-hover:border-teal-400/50",
        gradient: "from-teal-400/20 to-transparent",
        isPaid: false
    },
    {
        path: "/screeners/nifty-analysis",
        label: "Optics",
        description: "Nifty options analytics, derivatives sentiment, and institutional positioning structure.",
        icon: Search,
        color: "text-sky-400",
        bgColor: "bg-sky-400/10",
        borderColor: "group-hover:border-sky-400/50",
        gradient: "from-sky-400/20 to-transparent",
        isPaid: false
    },
    {
        path: "/screeners/intraday-breakout-scanner",
        label: "ML Setup",
        description: "Intraday volume breakout algorithmic scanner with quantitative momentum signals.",
        icon: Zap,
        color: "text-yellow-400",
        bgColor: "bg-yellow-400/10",
        borderColor: "group-hover:border-yellow-400/50",
        gradient: "from-yellow-400/20 to-transparent",
        isPaid: false
    },
    {
        path: "/screeners/breakout-v1",
        label: "Breakout Board V1",
        description: "Stocks trading above recent resistance on daily charts with high volume. No Buy/Sell Recommendations.",
        icon: Activity,
        color: "text-indigo-400",
        bgColor: "bg-indigo-400/10",
        borderColor: "group-hover:border-indigo-400/50",
        gradient: "from-indigo-400/20 to-transparent",
        isPaid: false
    },
    ...(FEATURE_FLAGS.ENABLE_BREAKOUT_SCREENER ? [{
        path: "/screeners/near-resistance",
        label: "Near Resistance",
        description: "An algorithmic filter that highlights stocks approaching predefined algorithmic resistance levels in real time.",
        icon: TrendingUp,
        color: "text-emerald-400",
        bgColor: "bg-emerald-400/10",
        borderColor: "group-hover:border-emerald-400/50",
        gradient: "from-emerald-400/20 to-transparent",
        isPaid: false
    }] : []),
    ...(FEATURE_FLAGS.ENABLE_REVERSAL_SCREENER ? [{
        path: "/screeners/support-reversal",
        label: "Support Reversal",
        description: "An algorithmic filter that highlights stocks approaching predefined algorithmic support levels in real time.",
        icon: Zap,
        color: "text-blue-400",
        bgColor: "bg-blue-400/10",
        borderColor: "group-hover:border-blue-400/50",
        gradient: "from-blue-400/20 to-transparent",
        isPaid: false
    }] : []),
    ...(FEATURE_FLAGS.ENABLE_REACTION_ZONE_SCREENER ? [{
        path: "/screeners/reaction-zone",
        label: "Reaction Zone",
        description: "An algorithmic filter that highlights stocks approaching any predefined algorithmic levels in real time.",
        icon: Crosshair,
        color: "text-purple-400",
        bgColor: "bg-purple-400/10",
        borderColor: "group-hover:border-purple-400/50",
        gradient: "from-purple-400/20 to-transparent",
        isPaid: false
    }] : [])
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

            <div className="relative container mx-auto px-4 py-4 sm:py-6 pb-20">
                {/* Screener Top Disclaimer */}
                <div className="mb-4 p-2.5 sm:p-3 rounded-xl bg-primary/5 border border-primary/10 text-center">
                    <p className="text-[11px] md:text-xs text-muted-foreground/80 leading-relaxed font-medium capitalize">
                        Stocks shown are filtered based on the selected analytical criteria and do not constitute buy or sell recommendations. No ranking or prioritization is implied.
                    </p>
                </div>
                {/* Header */}
                <div className="mb-6 sm:mb-8 space-y-3 sm:space-y-4 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-black uppercase tracking-[0.2em]">
                        <Search className="w-3 h-3" />
                        Explore Opportunities
                    </div>

                    <div className="space-y-1 sm:space-y-2">
                        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tighter leading-none">
                            STOCK <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400">SCREENERS</span>
                        </h1>
                        <p className="text-muted-foreground text-sm sm:text-base max-w-2xl">
                            Advanced algorithmic filters to identify high-probability trading setups in real-time.
                        </p>
                    </div>
                </div>

                {/* Screener Cards Grid - Compact Layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
                    {screenerOptions.map((option) => {
                        const Icon = option.icon;

                        const CardContent = (
                            <Link key={option.path} to={option.path} className="group h-full block">
                                <GlassCard className={`relative p-3.5 sm:p-4 h-full flex flex-col justify-between overflow-hidden transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-xl border-white/10 rounded-2xl ${option.borderColor}`}>

                                    {/* Hover Gradient Background */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${option.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                                            <div className={`p-2 sm:p-2.5 rounded-xl ${option.bgColor} ${option.color} ring-1 ring-white/10 group-hover:scale-105 transition-transform duration-300`}>
                                                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                    option.isPaid
                                                        ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.15)]'
                                                        : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                                                }`}>
                                                    {option.isPaid ? 'Paid' : 'Free'}
                                                </span>
                                                <div className="p-1 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                                                    <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-white transition-colors" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <h3 className={`text-sm sm:text-base font-bold uppercase tracking-tight ${option.color} drop-shadow-sm`}>
                                                {option.label}
                                            </h3>
                                            <p className="text-xs text-muted-foreground/80 leading-relaxed line-clamp-2 group-hover:text-muted-foreground transition-colors">
                                                {option.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="relative z-10 mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider group-hover:text-muted-foreground transition-colors">
                                        <span>View Screener</span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                    </div>
                                </GlassCard>
                            </Link>
                        );

                        return option.isPaid ? (
                            <PremiumProtector key={option.path} requiredTier="pro">
                                {CardContent}
                            </PremiumProtector>
                        ) : (
                            <div key={option.path}>{CardContent}</div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default Screeners;