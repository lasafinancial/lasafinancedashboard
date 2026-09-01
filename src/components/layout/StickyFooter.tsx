import { ShieldAlert, Info, X } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation } from "react-router-dom";

export function StickyFooter() {
    const isMobile = useIsMobile();
    const [isVisible, setIsVisible] = useState(true);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const location = useLocation();

    useEffect(() => {
        if (isMobile) {
            const timer = setTimeout(() => {
                setIsCollapsed(true);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [isMobile]);

    if (location.pathname === "/screeners/obv-accumulation") {
        return null;
    }

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    exit={{ y: 100 }}
                    className={`fixed bottom-0 left-0 right-0 z-[100] bg-black/90 backdrop-blur-md border-t border-white/10 px-4 py-2.5 transition-all duration-500 ${isCollapsed ? 'h-10 cursor-pointer overflow-hidden' : 'h-auto'}`}
                    onClick={() => isCollapsed && setIsCollapsed(false)}
                >
                    <div className="container mx-auto flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 overflow-hidden">
                            {isCollapsed ? (
                                <Info className="w-4 h-4 text-primary shrink-0 animate-pulse" />
                            ) : (
                                <ShieldAlert className="w-4 h-4 text-warning shrink-0" />
                            )}
                            <p className={`text-[10px] md:text-xs text-muted-foreground leading-tight ${isCollapsed ? 'truncate opacity-50' : ''}`}>
                                Research services provided by Lasa Research Services, SEBI Registered Research Analyst - Regn. No. INH0000XXXXX - BSE Enlistment No. XXXX Registered office: [address] Scans, levels, projections and summaries on this platform are generated end-to-end by algorithmic and AI models under a documented methodology, reviewed and approved by [Analyst Name], NISM-Series-XV certified, who remains responsible for this research. Holdings disclosures for individual securities are provided on each stock's research page. We and our clients may or may not have holdings in any of these stocks. Analyst certification: the views in these scans accurately reflect the output of the documented methodology, and no part of the analyst's compensation is linked to the specific views expressed. Investments in securities are subject to market risk. Registration and certification do not assure returns or performance. Past patterns do not guarantee future results. Terms &amp; MITC | Methodology | Grievances — Compliance Officer: [name, email, phone] | SEBI SCORES | Smart ODR
                            </p>
                        </div>
                        {!isCollapsed && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsVisible(false);
                                }}
                                className="p-1 hover:bg-white/10 rounded-md transition-colors"
                            >
                                <X className="w-4 h-4 text-muted-foreground" />
                            </button>
                        )}
                        {isCollapsed && (
                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest whitespace-nowrap">Tap for Disclaimer</span>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
