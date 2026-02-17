"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ArrowRight, Volume2, VolumeX } from "lucide-react";
import { useState, type ReactNode, useRef, useEffect } from "react";

interface OnboardingModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onComplete: () => void;
}

export function OnboardingModal({ isOpen, onOpenChange, onComplete }: OnboardingModalProps) {
    const [step, setStep] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (isOpen) {
            const playAudio = () => {
                if (audioRef.current && !isMuted) {
                    audioRef.current.volume = 0.9; // Increased volume to 0.8
                    audioRef.current.play().catch(err => {
                        console.log("Audio play failed, waiting for interaction", err);
                    });
                }
            };

            // Attempt initial play
            playAudio();

            // Broad interaction listener
            const unlocked = () => {
                playAudio();
                window.removeEventListener("click", unlocked);
                window.removeEventListener("touchstart", unlocked);
            };
            window.addEventListener("click", unlocked);
            window.addEventListener("touchstart", unlocked);

            return () => {
                window.removeEventListener("click", unlocked);
                window.removeEventListener("touchstart", unlocked);
            };
        } else {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        }
    }, [isOpen, isMuted]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.muted = isMuted;
        }
    }, [isMuted]);

    const stepContent = [
        {
            title: "How Markets Move — Our Core Philosophy",
            description: (
                <div className="space-y-3">
                    <p className="text-xs sm:text-sm font-medium leading-relaxed italic text-primary/80">
                        Markets operate in two broad phases:
                    </p>
                    <div className="grid grid-cols-1 gap-2.5">
                        <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/20">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-1">Structured Phase (~70%)</h4>
                            <p className="text-[10px] sm:text-[11px] opacity-90 leading-relaxed">
                                Prices respect well-defined zones and historical behavior. Our algorithms analyze past data patterns to highlight important price levels where activity has previously concentrated.
                            </p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-accent/5 border border-accent/20">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-accent mb-1">Discovery Phase (~30%)</h4>
                            <p className="text-[10px] sm:text-[11px] opacity-90 leading-relaxed">
                                Markets move beyond known ranges and establish new price zones. During this phase, prices adapt to fresh information and evolving participation.
                            </p>
                        </div>
                    </div>
                    <p className="text-[11px] opacity-80 leading-relaxed">
                        Our platform continuously evaluates which phase the market is in, helping users interpret price behavior within its current context.
                    </p>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground italic leading-tight pt-2 border-t border-white/5">
                        Note: Insights are based on historical and statistical analysis. Information provided on this platform is for educational and analytical purposes only and does not constitute investment advice or guarantee future performance.
                    </p>
                </div>
            ),
            image: "/onboarding/paulos-finance-9086197_1920.jpg",
        },
        {
            title: "How Our Analysis Is Built",
            description: (
                <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                        <p className="text-xs sm:text-sm leading-relaxed mb-3">
                            Our proprietary algorithms analyze the last 5 years of data across <span className="text-primary font-bold">Nifty 500 stocks</span> using three complementary lenses — <span className="font-semibold italic">Model, Balance, and Pattern</span> — while also mapping key price-action–based Support and Resistance levels for added context.
                        </p>
                        <p className="text-xs leading-relaxed opacity-90 border-t border-primary/10 pt-3">
                            This multi-layered approach helps interpret market behavior rather than rely on any single indicator.
                        </p>
                    </div>
                    <p className="text-[10px] text-muted-foreground italic leading-normal">
                        Note : All levels and insights are derived from quantitative and historical analysis and are intended for informational purposes only.
                    </p>
                </div>
            ),
            image: "/onboarding/souandresantana-money-7923867_1280.jpg",
        },
        {
            title: "Our Dashboards at a Glance",
            description: (
                <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-2">
                        {[
                            { name: "1. Market Mood", desc: "Aggregated indicators that reflect the overall market environment based on broad data trends." },
                            { name: "2. Stock Analysis", desc: "Stock-specific views combining model, balance, pattern, and price-action levels for contextual analysis." },
                            { name: "3. Screeners", desc: "Rule-based filters to identify stocks matching predefined analytical conditions." }
                        ].map((item, i) => (
                            <div key={i} className="flex gap-3 items-start p-2 rounded-lg hover:bg-white/5 transition-colors">
                                <div className="space-y-0.5">
                                    <p className="text-[12px] font-bold text-foreground">{item.name}</p>
                                    <p className="text-[11px] opacity-70 leading-snug">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground italic leading-tight pt-2 border-t border-white/5">
                        Note : Dashboards present analytical insights derived from historical and quantitative data and are intended for informational purposes only.
                    </p>
                </div>
            ),
            image: "/onboarding/geralt-stock-exchange-6699421_1280.jpg",
        },
    ];

    const totalSteps = stepContent.length;

    const handleContinue = () => {
        if (step < totalSteps) {
            setStep(step + 1);
        } else {
            onComplete();
        }
    };

    const handleSkip = () => {
        onComplete();
    };

    return (
        <>
            <audio ref={audioRef} src="/onboarding/background-music.mp3" loop preload="auto" />
            <Dialog
                open={isOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        onComplete();
                    } else {
                        setStep(1);
                    }
                    onOpenChange(open);
                }}
            >
                <DialogContent className="gap-0 p-0 [&>button:last-child]:text-white sm:max-w-[600px] max-sm:max-h-[90vh] max-sm:w-[95vw]">
                    <div className="p-1 sm:p-2 relative">
                        <img
                            className="w-full h-48 sm:h-80 object-cover rounded-lg"
                            src={stepContent[step - 1].image}
                            width={600}
                            height={320}
                            alt="onboarding step"
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute bottom-4 right-4 h-7 w-7 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-sm border-none transition-all hover:scale-110 active:scale-95"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsMuted(!isMuted);
                            }}
                        >
                            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                        </Button>
                    </div>
                    <div className="space-y-4 sm:space-y-6 px-4 pb-4 pt-2 sm:px-6 sm:pb-6 sm:pt-3">
                        <DialogHeader>
                            <DialogTitle className="text-lg sm:text-xl font-bold">{stepContent[step - 1].title}</DialogTitle>
                            <DialogDescription className="leading-relaxed text-xs sm:text-sm" asChild>{stepContent[step - 1].description}</DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                            <div className="flex justify-center space-x-1.5 order-2 sm:order-1">
                                {[...Array(totalSteps)].map((_, index) => (
                                    <div
                                        key={index}
                                        className={cn(
                                            "h-1.25 w-1.25 sm:h-1.5 sm:w-1.5 rounded-full bg-primary",
                                            index + 1 === step ? "bg-primary" : "opacity-20",
                                        )}
                                    />
                                ))}
                            </div>
                            <DialogFooter className="flex-row items-center justify-between sm:justify-end gap-2 order-1 sm:order-2">
                                <Button type="button" variant="ghost" onClick={handleSkip} className="px-3 sm:px-4 text-xs sm:text-sm h-8 sm:h-9">
                                    Skip
                                </Button>
                                {step < totalSteps ? (
                                    <Button className="group text-xs sm:text-sm h-8 sm:h-9" type="button" onClick={handleContinue}>
                                        Next
                                        <ArrowRight
                                            className="-me-1 ms-2 opacity-60 transition-transform group-hover:translate-x-0.5"
                                            size={14}
                                            strokeWidth={2}
                                            aria-hidden="true"
                                        />
                                    </Button>
                                ) : (
                                    <Button className="text-xs sm:text-sm h-8 sm:h-9" type="button" onClick={handleContinue}>
                                        Get Started
                                    </Button>
                                )}
                            </DialogFooter>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
