"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { GraduationCap, TrendingUp, Award, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export type TraderType = "Beginner" | "Mid-level" | "Expert";

interface TraderTypeModalProps {
    isOpen: boolean;
    onSelect: (type: TraderType) => void;
}

export const TraderTypeModal = ({ isOpen, onSelect }: TraderTypeModalProps) => {
    const [selected, setSelected] = useState<TraderType | null>(null);

    const types = [
        {
            id: "Beginner" as TraderType,
            title: "Beginners",
            description: "New to the markets. Looking for guidance and learning.",
            icon: GraduationCap,
            color: "text-blue-400",
            bg: "bg-blue-400/10",
            border: "border-blue-400/20"
        },
        {
            id: "Mid-level" as TraderType,
            title: "Part-time traders",
            description: "Some experience. Using data to refine strategies.",
            icon: TrendingUp,
            color: "text-primary",
            bg: "bg-primary/10",
            border: "border-primary/20"
        },
        {
            id: "Expert" as TraderType,
            title: "Professional traders / analysts",
            description: "Consistent trader. Seeking deep data and algo signals.",
            icon: Award,
            color: "text-amber-400",
            bg: "bg-amber-400/10",
            border: "border-amber-400/20"
        }
    ];

    const handleConfirm = () => {
        if (selected) {
            onSelect(selected);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-[500px] border-white/10 bg-background/95 backdrop-blur-xl p-0 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />

                <div className="relative p-6 pt-8 text-center">
                    <DialogHeader className="space-y-3 mb-8">
                        <DialogTitle className="text-2xl font-bold tracking-tight">
                            Personalize Your <span className="gradient-text">Experience</span>
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground text-sm">
                            Tell us your experience level so we can better tailor your LASA dashboard.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 mb-8">
                        {types.map((type) => {
                            const Icon = type.icon;
                            const isSelected = selected === type.id;

                            return (
                                <button
                                    key={type.id}
                                    onClick={() => setSelected(type.id)}
                                    className={cn(
                                        "relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 text-left group",
                                        isSelected
                                            ? cn(type.border, type.bg, "ring-1", type.color.replace('text', 'ring'))
                                            : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10"
                                    )}
                                >
                                    <div className={cn(
                                        "p-2.5 rounded-xl transition-colors",
                                        isSelected ? type.bg : "bg-white/5"
                                    )}>
                                        <Icon className={cn("h-5 w-5", isSelected ? type.color : "text-muted-foreground")} />
                                    </div>

                                    <div className="flex-1">
                                        <h4 className={cn(
                                            "font-semibold transition-colors",
                                            isSelected ? "text-foreground" : "text-muted-foreground"
                                        )}>
                                            {type.title}
                                        </h4>
                                        <p className="text-xs text-muted-foreground line-clamp-1">
                                            {type.description}
                                        </p>
                                    </div>

                                    {isSelected && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                            <CheckCircle2 className={cn("h-5 w-5", type.color)} />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <Button
                        disabled={!selected}
                        onClick={handleConfirm}
                        className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
                    >
                        Start Your Journey
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
