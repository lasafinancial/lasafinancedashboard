import React, { useState } from 'react';
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import { Check, Info, ShieldAlert } from 'lucide-react';

export const Pricing = () => {
    const { user } = useAuth();
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

    return (
        <div className="min-h-screen bg-[#020617] text-white selection:bg-primary/30 py-20 px-4 md:px-8 font-sans">
            <div className="max-w-6xl mx-auto space-y-16">
                
                {/* Header Section */}
                <div className="text-center space-y-6">
                    <div className="flex items-center justify-center gap-2 text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">
                        <span className="w-1 h-1 bg-amber-500 rounded-full" />
                        Research Packages 2024
                    </div>
                    
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
                        Research <span className="text-amber-500/90 italic font-serif">built</span><br />
                        for serious traders
                    </h1>
                    
                    <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                        SEBI Registered Research Analyst. Institutional-grade analysis, 
                        screeners, and trade ideas — for every level of market participant.
                    </p>

                    {/* Toggle */}
                    <div className="flex items-center justify-center mt-8">
                        <div className="bg-white/5 p-1 rounded-xl flex items-center border border-white/10">
                            <button 
                                onClick={() => setBillingCycle('monthly')}
                                className={`px-6 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all ${
                                    billingCycle === 'monthly' 
                                    ? 'bg-white/10 text-white shadow-sm' 
                                    : 'text-muted-foreground hover:text-white'
                                }`}
                            >
                                MONTHLY
                            </button>
                            <button 
                                onClick={() => setBillingCycle('annual')}
                                className={`px-6 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all flex items-center gap-2 ${
                                    billingCycle === 'annual' 
                                    ? 'bg-white/10 text-white shadow-sm' 
                                    : 'text-muted-foreground hover:text-white'
                                }`}
                            >
                                ANNUAL
                                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/30">
                                    SAVE ₹3K
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Dashboard Packages */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase pl-2">
                        <span className="w-1 h-1 bg-primary rounded-full" />
                        Dashboard Packages
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3">
                        {/* Starter Plan */}
                        <div className="bg-[#0b101e] border-t-2 border-emerald-500 p-8 flex flex-col relative border-r border-b border-l border-white/5">
                            <div className="mb-6">
                                <span className="text-[10px] font-bold tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 uppercase">
                                    Basic
                                </span>
                            </div>
                            <h3 className="text-3xl font-bold font-serif mb-2">Starter</h3>
                            <p className="text-sm text-muted-foreground mb-8 min-h-[40px]">
                                Market intelligence at no cost. Begin your research journey.
                            </p>
                            
                            <div className="mb-8">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl text-muted-foreground">₹</span>
                                    <span className="text-5xl font-bold">0</span>
                                </div>
                                <div className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
                                    <span className="text-white/30">/</span> forever
                                </div>
                                <div className="text-xs text-muted-foreground mt-2">No credit card required</div>
                            </div>
                            
                            <div className="space-y-4 mb-8 flex-1">
                                {[
                                    'Live Market Breadth Dashboard',
                                    'Index Performance Tracker (Nifty, Sensex, Bank Nifty)',
                                    '1 In-depth Stock Analysis per day',
                                    'Educational market commentary'
                                ].map((feature, i) => (
                                    <div key={i} className="flex gap-3 text-sm text-white/80">
                                        <div className="mt-1 flex-shrink-0">
                                            <div className="w-1.5 h-1.5 rotate-45 bg-emerald-500" />
                                        </div>
                                        {feature}
                                    </div>
                                ))}
                            </div>
                            
                            <button className="w-full py-4 text-sm font-bold tracking-widest text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/10 transition-colors uppercase rounded">
                                Get Started Free
                            </button>
                            
                            <p className="text-[10px] text-muted-foreground mt-6 leading-relaxed opacity-60">
                                Data-driven information only. Not a buy/sell recommendation. SEBI RA Reg. No. INH000XXXXXX.
                            </p>
                        </div>

                        {/* Analyst Plan */}
                        <div className="bg-[#0b101e] border-t-2 border-blue-500 p-8 flex flex-col relative border-r border-b border-l border-white/5 md:border-l-0">
                            <div className="mb-6">
                                <span className="text-[10px] font-bold tracking-widest text-blue-400 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20 uppercase">
                                    Premium
                                </span>
                            </div>
                            <h3 className="text-3xl font-bold font-serif mb-2">Analyst</h3>
                            <p className="text-sm text-muted-foreground mb-8 min-h-[40px]">
                                Screeners, signals, and daily Nifty insights for active traders.
                            </p>
                            
                            <div className="mb-8">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl text-muted-foreground">₹</span>
                                    <span className="text-5xl font-bold">
                                        {billingCycle === 'monthly' ? '600' : '550'}
                                    </span>
                                </div>
                                <div className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
                                    <span className="text-white/30">/</span> month
                                </div>
                                <div className="text-xs text-muted-foreground mt-2">
                                    {billingCycle === 'monthly' 
                                        ? 'Billed monthly • Cancel anytime' 
                                        : 'Billed annually at ₹6,600 • Save ₹600'
                                    }
                                </div>
                            </div>
                            
                            <div className="space-y-4 mb-8 flex-1">
                                {[
                                    'Everything in Starter',
                                    'Advanced Stock Screeners',
                                    'Technical Indicators Suite',
                                    'Daily Nifty Analysis Report',
                                    '2 Trade Ideas per week (Cash)',
                                    '2 Stock Analyses per day'
                                ].map((feature, i) => (
                                    <div key={i} className="flex gap-3 text-sm text-white/80">
                                        <div className="mt-1 flex-shrink-0">
                                            <div className="w-1.5 h-1.5 rotate-45 bg-blue-500" />
                                        </div>
                                        {feature}
                                    </div>
                                ))}
                            </div>
                            
                            <button className="w-full py-4 text-sm font-bold tracking-widest text-blue-400 border border-blue-500/30 hover:bg-blue-500/10 transition-colors uppercase rounded bg-blue-500/5">
                                Subscribe Now
                            </button>
                            
                            <p className="text-[10px] text-muted-foreground mt-6 leading-relaxed opacity-60">
                                Research by SEBI RA Reg. No. INH000XXXXXX. Trade ideas are research recommendations, not guaranteed returns. For registered subscribers only.
                            </p>
                        </div>

                        {/* Pro Trader Plan */}
                        <div className="bg-[#0b101e] border-t-2 border-amber-500 p-8 flex flex-col relative border-r border-b border-l border-white/5 md:border-l-0">
                            <div className="absolute top-4 right-4">
                                <span className="text-[9px] font-bold tracking-widest text-amber-500 border border-amber-500/30 px-2 py-1 rounded flex items-center gap-1 uppercase">
                                    <span className="w-1 h-1 bg-amber-500 rounded-full" />
                                    Most Value
                                </span>
                            </div>
                            <div className="mb-6">
                                <span className="text-[10px] font-bold tracking-widest text-amber-600 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20 uppercase">
                                    Elite
                                </span>
                            </div>
                            <h3 className="text-3xl font-bold font-serif mb-2">Pro Trader</h3>
                            <p className="text-sm text-muted-foreground mb-8 min-h-[40px]">
                                Full-spectrum research. Cash + F&O ideas. Maximum analysis depth.
                            </p>
                            
                            <div className="mb-8">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl text-muted-foreground">₹</span>
                                    <span className="text-5xl font-bold">
                                        {billingCycle === 'monthly' ? '1,500' : '1,250'}
                                    </span>
                                </div>
                                <div className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
                                    <span className="text-white/30">/</span> month
                                </div>
                                <div className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                                    {billingCycle === 'monthly' 
                                        ? 'Billed monthly • Cancel anytime' 
                                        : 'Billed annually at ₹15,000 • Save ₹3,000'
                                    }
                                </div>
                                {billingCycle === 'monthly' && (
                                    <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold tracking-widest text-amber-600 uppercase">
                                        <StarIcon /> Introductory Price
                                    </div>
                                )}
                            </div>
                            
                            <div className="space-y-4 mb-8 flex-1">
                                {[
                                    'Everything in Analyst',
                                    'Cash Trade Ideas — 2 to 3 per week',
                                    'F&O Trade Ideas — 2 to 3 per week',
                                    'Up to 10 Stock Analyses per day (priority)',
                                    'Dedicated research support',
                                    'Early access to price increases'
                                ].map((feature, i) => (
                                    <div key={i} className="flex gap-3 text-sm text-white/80">
                                        <div className="mt-1 flex-shrink-0">
                                            <div className="w-1.5 h-1.5 rotate-45 bg-amber-500" />
                                        </div>
                                        {feature}
                                    </div>
                                ))}
                            </div>
                            
                            <button className="w-full py-4 text-sm font-bold tracking-widest text-black bg-amber-500 hover:bg-amber-400 transition-colors uppercase rounded">
                                Join Elite
                            </button>
                            
                            <p className="text-[10px] text-muted-foreground mt-6 leading-relaxed opacity-60">
                                SEBI RA Reg. No. INH000XXXXXX. F&O research involves higher risk. Suitable for investors with adequate risk tolerance. Risk profiling mandatory at onboarding.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Standalone Strategy */}
                <div className="space-y-4 pt-8">
                    <div className="flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase pl-2">
                        <span className="w-1 h-1 bg-purple-500 rounded-full" />
                        Standalone Strategy
                    </div>
                    
                    <div className="bg-[#12111a] border-l-2 border-purple-500 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative border-t border-r border-b border-white/5">
                        <div className="space-y-3 flex-1">
                            <span className="text-[10px] font-bold tracking-widest text-purple-400 bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20 uppercase">
                                Smallcase Strategy
                            </span>
                            <h3 className="text-2xl font-bold font-serif">Dynamic Portfolio Rotation</h3>
                            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
                                A rules-based portfolio rotation strategy, rebalanced systematically based on momentum, sector strength, and market regime signals. Standalone product — independent of dashboard tiers.
                            </p>
                            <div className="flex flex-wrap items-center gap-4 text-xs text-white/60 pt-2">
                                <div className="flex items-center gap-1.5"><div className="w-1 h-1 bg-purple-500 rounded-full"/> Rules-based rotation</div>
                                <div className="flex items-center gap-1.5"><div className="w-1 h-1 bg-purple-500 rounded-full"/> Systematic rebalancing</div>
                                <div className="flex items-center gap-1.5"><div className="w-1 h-1 bg-purple-500 rounded-full"/> Sector & momentum driven</div>
                                <div className="flex items-center gap-1.5"><div className="w-1 h-1 bg-purple-500 rounded-full"/> Standalone subscription</div>
                            </div>
                        </div>
                        
                        <div className="flex flex-col items-start md:items-end gap-3 min-w-[200px]">
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl text-muted-foreground">₹</span>
                                <span className="text-4xl font-bold">800</span>
                            </div>
                            <div className="text-xs text-muted-foreground font-mono tracking-tight text-right w-full">
                                per month • standalone
                            </div>
                            <button className="w-full md:w-auto px-8 py-3 text-xs font-bold tracking-widest text-purple-400 border border-purple-500/30 hover:bg-purple-500/10 transition-colors uppercase rounded mt-2">
                                Subscribe
                            </button>
                        </div>
                    </div>

                    {/* Elite Annual Banner */}
                    <div className="bg-[#0f1714] border-l-2 border-emerald-500 p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative border-t border-r border-b border-white/5 mt-4">
                        <div className="flex items-center gap-4">
                            <span className="text-[10px] font-bold tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded border border-emerald-500/20 uppercase whitespace-nowrap">
                                Annual - Elite
                            </span>
                            <div>
                                <h3 className="text-lg font-bold">Elite Annual Plan — Best Value</h3>
                                <p className="text-sm text-muted-foreground">Full Elite access • Lock in introductory pricing • ₹1,250/month effective</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <div className="text-emerald-400 text-sm font-bold">₹3,000 saved</div>
                                <div className="text-[10px] text-muted-foreground font-mono">vs monthly</div>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl text-muted-foreground">₹</span>
                                <span className="text-3xl font-bold">15,000</span>
                            </div>
                            <div className="text-xs text-muted-foreground font-mono tracking-tight">
                                per year
                            </div>
                            <button className="px-6 py-3 text-xs font-bold tracking-widest text-black bg-emerald-400 hover:bg-emerald-300 transition-colors uppercase rounded ml-4">
                                Get Annual
                            </button>
                        </div>
                    </div>
                </div>

                {/* Regulatory Disclosures */}
                <div className="pt-16">
                    <div className="flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase pl-2 mb-4">
                        <span className="w-1 h-1 bg-white/30 rounded-full" />
                        Regulatory Disclosures
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2">
                        <div className="bg-[#0b101e] p-8 border border-white/5 space-y-4">
                            <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-blue-400 uppercase">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                Screener & Data Screens
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-relaxed font-mono opacity-60">
                                Screener results are generated algorithmically based on technical and/or fundamental filters applied to publicly available market data. These outputs are data-driven and do not constitute a research recommendation, buy/sell advice, or endorsement of any security. Results should be used for analytical and educational purposes only. Investors must conduct independent due diligence before making any investment decisions. SEBI Registered Research Analyst | Reg. No. INH000XXXXXX.
                            </p>
                        </div>
                        
                        <div className="bg-[#0b101e] p-8 border-t border-r border-b border-white/5 md:border-l-0 space-y-4">
                            <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-amber-500 uppercase">
                                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                                Trade Ideas & Research Reports
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-relaxed font-mono opacity-60">
                                Trade ideas are published by Lasa, a SEBI Registered Research Analyst (Reg. No. INH000XXXXXX) under SEBI (Research Analysts) Regulations, 2014. Research is prepared for the exclusive use of registered subscribers and is not for public circulation or redistribution. The analyst or Lasa may or may not hold positions in mentioned securities. Conflicts of interest, if any, are disclosed in each report. Past performance is not indicative of future results. F&O instruments carry higher risk and are suitable only for investors with adequate risk tolerance. Risk profiling is mandatory prior to onboarding for Elite subscribers.
                            </p>
                        </div>
                    </div>
                    
                    <div className="bg-[#0b101e] p-8 border-l border-r border-b border-white/5">
                        <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-3">
                            Full Regulatory Disclosure
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed font-mono opacity-60">
                            Lasa is a SEBI Registered Research Analyst under SEBI (Research Analysts) Regulations, 2014 | Reg. No. INH000XXXXXX. All research, analyses, trade ideas, and market content shared are for registered subscribers only and not for public circulation. This is not an offer or solicitation to buy or sell any securities. Investments in equity and F&O markets are subject to market risk. Read all scheme-related documents carefully. Past performance is not indicative of future returns. No guaranteed returns are promised or implied. Pricing is standardised for all subscribers of the same tier in compliance with SEBI RA Regulations. | Grievances: contact@lasa.in | SEBI Scores: scores.sebi.gov.in
                        </p>
                    </div>
                </div>
                
            </div>
        </div>
    );
};

const StarIcon = () => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
);

export default Pricing;
