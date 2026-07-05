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
                                <span className="font-bold text-foreground">LASA Finance</span> is an analytical platform providing algorithm and AI-generated market data for educational and informational purposes only. All content on this platform does not constitute investment advice, research, or a recommendation to buy or sell any security. Past analytical patterns do not guarantee future results. Users are advised to consult a SEBI-registered financial advisor before making any investment decisions. LASA Finance and its operators are not liable for any financial gains or losses arising from use of this platform.
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
