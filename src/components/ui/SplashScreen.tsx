import { TrendingUp, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export const SplashScreen = ({ progress }: { progress: number }) => {
    return (
        <div className="fixed inset-0 z-[999] bg-background flex flex-col items-center justify-center overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative flex flex-col items-center gap-8"
            >
                {/* Logo Section */}
                <div className="flex flex-col items-center gap-4 mb-2">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
                        <img
                            src="/complogo.png"
                            alt="LASA Logo"
                            className="relative h-20 w-20 object-contain brightness-110 drop-shadow-[0_0_15px_rgba(var(--primary),0.3)]"
                        />
                    </div>
                    <div className="flex flex-col items-center text-center">
                        <span className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
                            LASA <span className="gradient-text">RESEARCH SERVICES</span>
                        </span>
                        <span className="text-[10px] md:text-xs font-bold tracking-[0.3em] text-muted-foreground/60 mt-1 uppercase">
                            Think Global... Think Smart
                        </span>
                    </div>
                </div>

                {/* Loading Indicator */}
                <div className="flex flex-col items-center gap-4">
                    <div className="relative w-48 h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            className="absolute left-0 top-0 h-full bg-primary"
                            initial={{ width: "0%" }}
                            animate={{ width: `${progress}%` }}
                            transition={{
                                duration: 1,
                                ease: "easeOut"
                            }}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Loader2 className="w-3 h-3 text-primary animate-spin" />
                        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.2em] font-medium">
                            {progress < 100 ? "Initializing Live Markets" : "System Ready"}
                        </span>
                    </div>
                </div>
            </motion.div>

            {/* Footer Branding */}
            <div className="absolute bottom-12 left-0 right-0 text-center">
                <p className="text-[10px] font-mono text-muted-foreground/30 uppercase tracking-widest">
                    Proprietary Multimodal Algorithms v2.0
                </p>
            </div>
        </div>
    );
};
