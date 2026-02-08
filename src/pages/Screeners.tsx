import { useState } from "react";
import { Filter, ChevronDown, TrendingUp, ArrowUpRight, Search, RefreshCw } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Link, useNavigate } from "react-router-dom";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const screenerOptions = [
    { path: "/screeners/near-resistance", label: "Near Resistance", description: "Bullish stocks near resistance levels" },
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

            <div className="relative container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-12 space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-[0.2em]">
                        <Filter className="w-3.5 h-3.5" />
                        Screeners
                    </div>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
                            STOCK <span className="text-primary italic">SCREENERS</span>
                        </h1>

                        {/* Dropdown Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/40 transition-all font-black text-sm uppercase tracking-widest">
                                    <Filter className="w-4 h-4" />
                                    Select Screener
                                    <ChevronDown className="w-4 h-4" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-64 bg-[#0c1120]/95 backdrop-blur-2xl border-primary/20 rounded-xl p-2">
                                {screenerOptions.map((option) => (
                                    <DropdownMenuItem
                                        key={option.path}
                                        onClick={() => navigate(option.path)}
                                        className="flex flex-col items-start gap-1 p-4 rounded-xl cursor-pointer hover:bg-primary/10 transition-colors"
                                    >
                                        <span className="font-black text-sm uppercase tracking-wide">{option.label}</span>
                                        <span className="text-xs text-muted-foreground">{option.description}</span>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Screener Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {screenerOptions.map((option) => (
                        <Link key={option.path} to={option.path}>
                            <GlassCard className="p-8 group hover:bg-white/[0.03] border-primary/5 hover:border-primary/30 transition-all duration-500 cursor-pointer h-full">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="p-4 rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                                        <TrendingUp className="w-8 h-8" />
                                    </div>
                                    <ArrowUpRight className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                                <h3 className="text-2xl font-black uppercase tracking-tight mb-2 group-hover:text-primary transition-colors">
                                    {option.label}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {option.description}
                                </p>
                            </GlassCard>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Screeners;