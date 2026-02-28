import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

export function DisclaimerModal() {
    const { user, userData, updateUserData } = useAuth();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [accepted, setAccepted] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const checkDisclaimerStatus = async () => {
            if (!user || !userData) {
                setIsOpen(false);
                return;
            }

            // Bypass on admin page
            if (location.pathname === "/admin") {
                setIsOpen(false);
                return;
            }

            // Only show if onboarding steps are done but disclaimer hasn't been accepted in Firestore
            const hasDoneBasics = userData.hasSeenOnboarding && userData.traderType && userData.hasCompletedProfile;
            if (hasDoneBasics && !userData.disclaimerAcceptedAt) {
                setIsOpen(true);
            } else {
                setIsOpen(false);
            }
        };

        checkDisclaimerStatus();
    }, [user, userData, location.pathname]);

    const handleAccept = async () => {
        if (!user || !accepted) return;

        setLoading(true);
        try {
            // Fetch User IP for compliance logging
            let userIP = "Unknown";
            try {
                const ipResponse = await fetch('https://api.ipify.org?format=json');
                if (ipResponse.ok) {
                    const ipData = await ipResponse.json();
                    userIP = ipData.ip;
                }
            } catch (ipErr) {
                console.error("Failed to fetch IP:", ipErr);
            }

            await updateUserData({
                disclaimerAcceptedAt: serverTimestamp(),
                disclaimerVersion: "2.5", // Incremented for the new text + checkbox requirement
                acceptanceIP: userIP
            });

            setIsOpen(false);
            toast.success("Identity Verified. Access Granted.");
        } catch (error) {
            console.error("Error saving disclaimer acceptance:", error);
            toast.error("Failed to save. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-[550px] border-l-4 border-l-primary p-0 overflow-hidden" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />

                <div className="p-6 sm:p-8 space-y-6 relative max-h-[85vh] overflow-y-auto custom-scrollbar">
                    <DialogHeader className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
                                <AlertTriangle className="h-6 w-6 text-orange-500" />
                            </div>
                            <DialogTitle className="text-2xl font-bold tracking-tight">Final Legal Disclaimer</DialogTitle>
                        </div>
                        <DialogDescription className="text-sm font-medium text-muted-foreground">
                            {userData?.name ? `Hello ${userData.name}, please` : "Please"} acknowledge the following to access the dashboard.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-5 sm:p-6 bg-muted/40 rounded-2xl border border-white/5 text-sm sm:text-base leading-relaxed text-foreground/90 font-medium italic">
                        "The information, price levels, and analytics are generated from algorithmic models and are intended solely for educational and research purposes. Nothing on this platform constitutes investment advice, recommendation, or solicitation. Users should exercise independent judgment and consult a SEBI-registered investment advisor before making any financial decisions. The platform, its owners, and affiliates are not liable for any direct or indirect losses or gains resulting from the use of this data or securities shown in the screener."
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-start space-x-3 p-4 rounded-xl bg-primary/5 border border-primary/20 transition-all hover:bg-primary/10">
                            <Checkbox
                                id="legal-agree"
                                checked={accepted}
                                onCheckedChange={(checked) => setAccepted(checked as boolean)}
                                className="mt-1"
                            />
                            <div className="grid gap-1.5 leading-none">
                                <Label
                                    htmlFor="legal-agree"
                                    className="text-sm font-bold leading-none cursor-pointer hover:text-primary transition-colors"
                                >
                                    I have read and agree to the legal disclaimer
                                </Label>
                                <p className="text-[11px] text-muted-foreground leading-snug">
                                    I acknowledge that the data is for educational use and I accept full responsibility for my financial decisions.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
                            <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                            <p className="text-[10px] text-muted-foreground leading-snug">
                                Your acceptance is securely logged with IP address and timestamp.
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            onClick={handleAccept}
                            disabled={loading || !accepted}
                            className="w-full h-12 text-lg font-bold shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">Processing...</span>
                            ) : (
                                "I Understand & Acknowledge"
                            )}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
