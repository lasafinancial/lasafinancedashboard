"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { UserCircle, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface ProfileSetupModalProps {
    isOpen: boolean;
    onComplete: (name: string) => void;
}

export function ProfileSetupModal({ isOpen, onComplete }: ProfileSetupModalProps) {
    const { userData } = useAuth();
    const [name, setName] = useState(userData?.name || "");

    const handleNext = () => {
        if (!name.trim()) {
            toast.error("Please enter your name");
            return;
        }
        onComplete(name.trim());
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-[450px]" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
                <DialogHeader>
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <UserCircle className="h-6 w-6 text-primary" />
                    </div>
                    <DialogTitle className="text-xl font-bold">Complete Your Profile</DialogTitle>
                    <DialogDescription>
                        We just need your name to personalize your dashboard experience.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="setup-name" className="text-sm font-semibold">What should we call you?</Label>
                        <Input
                            id="setup-name"
                            placeholder="Enter your name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-white/5 border-white/10 h-11"
                            autoFocus
                        />
                    </div>

                    <div className="p-4 bg-muted/40 rounded-xl border border-white/5 space-y-3">
                        <p className="text-xs leading-relaxed text-muted-foreground">
                            <span className="font-bold text-foreground">Disclaimer:</span> LASA Finance is an analytics and educational platform. We provide market tools and data visualization. We are <span className="font-bold text-foreground">NOT</span> a SEBI-registered investment adviser.
                        </p>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                            No content here constitutes investment advice. Always consult a qualified financial advisor before investing.
                        </p>
                    </div>
                </div>

                <DialogFooter className="flex flex-col sm:flex-row items-center gap-4 sm:gap-0">
                    <p className="text-[10px] text-muted-foreground text-center sm:text-left">
                        Your name and acceptance will be logged for compliance.
                    </p>
                    <Button
                        type="button"
                        onClick={handleNext}
                        disabled={!name.trim()}
                        className="w-full sm:w-auto px-6 h-11 font-bold gap-2"
                    >
                        Accept & Enter <ShieldCheck className="h-4 w-4" />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
