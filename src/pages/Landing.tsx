import React from 'react';
import SchemaCard from "@/components/ui/schema-card-with-animated-wave-visualizer";
import { Button } from "@/components/ui/button";
import { ChevronRight, Database, BarChart3, ShieldCheck, Zap } from "lucide-react";
import { InteractiveHero } from "@/components/ui/interactive-hero";
import { SplineSceneBasic } from "@/components/ui/spline-scene-basic";

export default function LandingPage({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-indigo-500/30">
      {/* Background Schema Visualizer */}
        <div className="fixed inset-0 z-0">
          <SchemaCard showContent={false} />
        </div>

          {/* Content Overlay */}
            <div className="relative z-10 flex flex-col items-center justify-start min-h-screen px-4 pt-20 pb-0 overflow-y-auto">
            {/* Brand Tag */}
            <div className="mb-6 animate-fade-in">
              <span className="px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-sm font-medium backdrop-blur-md">
                The Future of Intelligence
              </span>
            </div>

            {/* Hero Title */}
            <div className="mb-12 text-center w-full px-4">
              <h1 className="text-4xl sm:text-6xl md:text-8xl lg:text-[10rem] font-bold tracking-tighter animate-scale-in leading-[0.9] py-4 break-words">
                LASA <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-white to-indigo-400 animate-gradient">FINANCE</span>
              </h1>
            </div>

            {/* AI Logo / Representative Image */}
            <div className="relative w-56 h-56 md:w-80 md:h-80 mb-12 animate-float z-20">
            <div className="absolute inset-0 rounded-full bg-indigo-500/30 blur-3xl animate-pulse" />
            <img 
              src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=1000" 
              alt="LASA Finance AI" 
              className="relative w-full h-full object-cover rounded-3xl border border-white/20 shadow-2xl shadow-indigo-500/40 transform hover:scale-105 transition-transform duration-500"
            />
          </div>

          {/* Dashboard Preview Info */}
          <div className="max-w-6xl w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 px-4">
          {[
            { icon: <BarChart3 className="w-5 h-5" />, title: "Live Markets", desc: "Real-time stock & sector tracking" },
            { icon: <Database className="w-5 h-5" />, title: "ML Sentiment", desc: "AI-driven market mood analysis" },
            { icon: <Zap className="w-5 h-5" />, title: "Predictive Analytics", desc: "Confidence-weighted price modeling" },
            { icon: <ShieldCheck className="w-5 h-5" />, title: "Risk Mitigation", desc: "Advanced volatility scoring" }
          ].map((item, i) => (
            <div 
              key={i} 
              className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors animate-fade-in"
              style={{ animationDelay: `${(i + 1) * 200}ms` }}
            >
              <div className="text-indigo-400 mb-2">{item.icon}</div>
              <h3 className="text-sm font-semibold mb-1">{item.title}</h3>
              <p className="text-xs text-white/50">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Enter Button */}
        <div className="animate-fade-in delay-1000 mb-10">
          <Button 
            onClick={onEnter}
            className="group relative px-8 py-6 bg-white text-black hover:bg-white/90 rounded-full text-lg font-semibold transition-all hover:scale-105 active:scale-95 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              Access Dashboard
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </Button>
        </div>

        {/* Interactive Hero Section */}
        <div className="w-full max-w-7xl px-4 mb-4">
          <InteractiveHero />
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-white/30 text-xs font-mono animate-fade-in delay-2000">
          SYSTEM STATUS: OPTIMIZED | NEURAL LINK: ACTIVE | VERSION 2.4.0
        </div>
      </div>
    </div>
  );
}
