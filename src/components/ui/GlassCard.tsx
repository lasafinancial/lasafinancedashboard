import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  delay?: number;
}

export function GlassCard({ children, className = "", contentClassName = "", delay = 0 }: GlassCardProps) {
  const delayClass = delay > 0 ? `animate-fade-in-up-delay-${Math.round(delay * 10)}` : "animate-fade-in-up";
  
    return (
      <div
        className={`group relative overflow-hidden rounded-2xl border border-white/5 bg-card/40 p-6 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] hover:border-white/10 ${delayClass} ${className}`}
      >
        {/* Sleek inner border/ring for glass effect */}
        <div className="absolute inset-0 rounded-2xl border border-white/5 pointer-events-none ring-1 ring-inset ring-white/5" />
        
        {/* Dynamic gradient glow that shifts on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5 opacity-0 transition-opacity duration-700 group-hover:opacity-100 pointer-events-none" />
        
        {/* Subtle top light reflection */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      
      {/* Content */}
      <div className={`relative z-10 ${contentClassName}`}>
        {children}
      </div>
    </div>
  );
}
