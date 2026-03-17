import React from 'react';
import { GlassCard } from "@/components/ui/GlassCard";
import { Check, X, Crown, Zap, Shield, Star, Rocket, MessageSquare, BarChart3, TrendingUp, Search, Newspaper, Filter, Book, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";

const features = [
    { name: "Market Mood", free: true, pro: true, elite: true },
    { name: "Dashboard Charts (historical)", free: true, pro: true, elite: true },
    { name: "Dashboard Live Readings", free: false, pro: true, elite: true },
    { name: "Index Overview", free: true, pro: true, elite: true },
    { name: "Index Sector Drill-down", free: false, pro: true, elite: true },
    { name: "News — full", free: true, pro: true, elite: true },
    { name: "Stock Analysis", free: "3/day", pro: "Unlimited", elite: "Unlimited" },
    { name: "LASA Intel", free: false, pro: true, elite: true },
    { name: "Fundamental Widget", free: false, pro: true, elite: true },
    { name: "All Screeners", free: false, pro: true, elite: true },
    { name: "Holdings Import", free: true, pro: true, elite: true },
    { name: "Holdings Signals", free: "1 stock", pro: "All", elite: "All" },
    { name: "Watchlist Zone + Alerts", free: false, pro: true, elite: true },
    { name: "Nifty Action Plan", free: false, pro: false, elite: true },
    { name: "SELECT POSITIONAL", free: false, pro: false, elite: true },
    { name: "WhatsApp Alerts", free: false, pro: false, elite: true },
    { name: "Track Record", free: false, pro: false, elite: true },
    { name: "Priority Support", free: false, pro: false, elite: true },
];

const FeatureIcon = ({ value }: { value: boolean | string }) => {
    if (value === true) return <div className="flex justify-center"><div className="bg-emerald-500/20 p-1.5 rounded-full"><Check className="w-4 h-4 text-emerald-500" /></div></div>;
    if (value === false) return <div className="flex justify-center"><div className="bg-rose-500/20 p-1.5 rounded-full"><X className="w-4 h-4 text-rose-500" /></div></div>;
    return <span className="text-sm font-medium text-center block text-foreground/80">{value}</span>;
};

export const Pricing = () => {
    const { user } = useAuth();
    const isAdmin = user?.email === 'm.tharan@bcah.christuniversity.in' || user?.email === 'lasafinancial@gmail.com' || user?.phoneNumber === '+919555151691' || user?.phoneNumber === '919555151691';

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="min-h-screen bg-[#020617] text-foreground selection:bg-primary/30 py-12 px-4">
            {/* Background Decor */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-1/3 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse delay-700" />
            </div>

            <div className="relative container mx-auto max-w-5xl">
                {/* Header */}
                <div className="text-center space-y-4 mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-[0.2em]"
                    >
                        <Crown className="w-3.5 h-3.5" />
                        Premium Plans
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-6xl font-black tracking-tighter leading-none mb-4"
                    >
                        LEVEL UP YOUR <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400">TRADING</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-muted-foreground text-lg max-w-2xl mx-auto"
                    >
                        Choose the plan that fits your trading style. Unlock professional-grade tools and insights.
                    </motion.p>
                </div>

                {/* Plan Highlights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <GlassCard className="p-8 border-white/5 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10 space-y-4">
                            <div className="p-3 bg-white/5 w-fit rounded-2xl border border-white/10 text-muted-foreground text-xs font-bold uppercase tracking-widest mb-4">Common Features</div>
                            <h3 className="text-2xl font-bold">FREE</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">Essential market awareness and basic tracking tools for every trader.</p>
                            <div className="text-3xl font-black pt-4">₹0 <span className="text-sm font-medium text-muted-foreground">/ forever</span></div>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-8 border-primary/20 bg-primary/5 relative overflow-hidden group ring-1 ring-primary/40">
                        <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
                        <div className="relative z-10 space-y-4">
                            <div className="p-3 bg-primary/20 w-fit rounded-2xl border border-primary/30 text-primary text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Zap className="w-3 h-3" /> Most Popular
                            </div>
                            <h3 className="text-2xl font-bold">PRO</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">Full access to live readings, sector insights, and algorithmic screeners.</p>
                            <div className="text-3xl font-black pt-4">₹999 <span className="text-sm font-medium text-muted-foreground">/ month</span></div>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-8 border-amber-500/20 bg-amber-500/5 relative overflow-hidden group ring-1 ring-amber-500/40">
                        <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl" />
                        <div className="relative z-10 space-y-4">
                            <div className="p-3 bg-amber-500/20 w-fit rounded-2xl border border-amber-500/30 text-amber-500 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Star className="w-3 h-3" /> Ultimate Suite
                            </div>
                            <h3 className="text-2xl font-bold">ELITE</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">The complete LASA experience with positional calls and priority support.</p>
                            <div className="text-3xl font-black pt-4">₹1,777 <span className="text-sm font-medium text-muted-foreground">/ month</span></div>
                        </div>
                    </GlassCard>
                </div>

                {/* Comparison Table */}
                <GlassCard className="overflow-hidden border-white/5 shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-white/5 border-b border-white/10">
                                    <th className="p-6 text-left text-sm font-bold uppercase tracking-widest text-muted-foreground">Feature</th>
                                    <th className="p-6 text-center text-sm font-bold uppercase tracking-widest text-muted-foreground">Free</th>
                                    <th className="p-6 text-center text-sm font-bold uppercase tracking-widest text-primary">Pro</th>
                                    <th className="p-6 text-center text-sm font-bold uppercase tracking-widest text-amber-500">Elite</th>
                                </tr>
                            </thead>
                            <tbody>
                                {features.map((feature, idx) => (
                                    <tr
                                        key={feature.name}
                                        className={`border-b border-white/5 transition-colors hover:bg-white/5 ${idx % 2 === 0 ? 'bg-white/[0.02]' : ''}`}
                                    >
                                        <td className="p-5 text-sm font-medium text-foreground/90">{feature.name}</td>
                                        <td className="p-5 border-l border-white/5"><FeatureIcon value={feature.free} /></td>
                                        <td className="p-5 border-l border-white/5 bg-primary/5 font-bold"><FeatureIcon value={feature.pro} /></td>
                                        <td className="p-5 border-l border-white/5 bg-amber-500/5 font-bold"><FeatureIcon value={feature.elite} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Bottom CTA */}
                    <div className="p-8 border-t border-white/10 bg-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="text-center md:text-left">
                            <p className="text-sm text-muted-foreground mb-1 font-medium">Ready to start your journey?</p>
                            <p className="text-lg font-bold">Try our PRO features for FREE for the first week!</p>
                        </div>
                        <div className="flex gap-4">
                            <button className="px-8 py-3 rounded-xl bg-primary text-white font-bold hover:scale-105 transition-transform shadow-lg shadow-primary/20">
                                Start Free Trial
                            </button>
                            <button className="px-8 py-3 rounded-xl bg-white/5 border border-white/10 font-bold hover:bg-white/10 transition-colors">
                                Talk to Expert
                            </button>
                        </div>
                    </div>
                </GlassCard>

                {/* Professional Footer */}
                <div className="mt-16 text-center space-y-4 pb-20">
                    <p className="text-sm text-muted-foreground/60 max-w-2xl mx-auto">
                        Pricing includes GST (18%) where applicable. Cancel anytime. All plans are billed annually by default.
                        Contact us for custom enterprise solutions or multi-user licenses.
                    </p>
                    <div className="flex justify-center gap-8 pt-4">
                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer transition-colors uppercase tracking-widest">
                            <Shield className="w-3.5 h-3.5" /> Secure Checkout
                        </div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer transition-colors uppercase tracking-widest">
                            <Rocket className="w-3.5 h-3.5" /> Instant Activation
                        </div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer transition-colors uppercase tracking-widest">
                            <MessageSquare className="w-3.5 h-3.5" /> 24/7 Priority
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Pricing;
