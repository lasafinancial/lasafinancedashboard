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
    const { user } = useAuth();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [accepted, setAccepted] = useState(false);
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const checkDisclaimerStatus = async () => {
            if (!user) {
                console.log("[DisclaimerModal] No user, hiding.");
                setIsOpen(false);
                return;
            }

            // Bypass on admin page
            if (location.pathname === "/admin") {
                setIsOpen(false);
                return;
            }

            try {
                console.log("[DisclaimerModal] Checking status for user:", user.uid);
                const userRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    const data = userSnap.data();
                    console.log("[DisclaimerModal] User data found:", data);

                    // If name is just the phone number (auto-populated by backend), clear it to force input
                    const currentName = data.name || "";
                    const isNamePhoneNumber = currentName.startsWith('+') || /^\d+$/.test(currentName.replace(/\s/g, ''));

                    if (isNamePhoneNumber) {
                        console.log("[DisclaimerModal] Name is phone number, clearing for manual entry.");
                        setName("");
                    } else if (currentName) {
                        setName(currentName);
                    }

                    // One-time only: if they've accepted in Firestore, don't show it again
                    if (data.disclaimerAcceptedAt) {
                        console.log("[DisclaimerModal] Already accepted at:", data.disclaimerAcceptedAt);
                        setIsOpen(false);
                    } else {
                        console.log("[DisclaimerModal] Not yet accepted.");
                        setIsOpen(true);
                    }
                } else {
                    console.log("[DisclaimerModal] New user record, needs acceptance.");
                    setIsOpen(true);
                }
            } catch (error) {
                console.error("[DisclaimerModal] Error checking disclaimer status:", error);
                setIsOpen(false);
            }
        };

        checkDisclaimerStatus();
    }, [user, location.pathname]);

    const handleAccept = async () => {
        if (!user || !accepted || !name.trim()) {
            if (!name.trim()) toast.error("Please enter your name");
            return;
        }

        setLoading(true);
        try {
            // Fetch User IP for compliance logging
            let userIP = "Unknown";
            try {
                const ipResponse = await fetch('https://api.ipify.org?format=json');
                const ipData = await ipResponse.json();
                userIP = ipData.ip;
            } catch (ipErr) {
                console.error("Failed to fetch IP:", ipErr);
            }

            const userRef = doc(db, "users", user.uid);

            await setDoc(userRef, {
                uid: user.uid,
                phoneNumber: user.phoneNumber,
                name: name.trim(),
                tier: "free",
                disclaimerAcceptedAt: serverTimestamp(),
                disclaimerVersion: "1.0",
                lastLoginAt: serverTimestamp(),
                acceptanceIP: userIP // Log the IP address
            }, { merge: true });

            // Mark as accepted for this session
            sessionStorage.setItem(`disclaimer_accepted_${user.uid}`, "true");

            setIsOpen(false);
            toast.success("Welcome, " + name.trim());
        } catch (error) {
            console.error("Error saving disclaimer acceptance:", error);
            toast.error("Failed to save. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && setIsOpen(true)}> {/* Prevent closing by clicking outside */}
            <DialogContent className="sm:max-w-[500px] border-l-4 border-l-primary" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-6 w-6 text-yellow-500" />
                        <DialogTitle className="text-xl">Welcome to LASA Finance</DialogTitle>
                    </div>
                    <DialogDescription className="text-base text-foreground/90 leading-relaxed">
                        Please provide your details and acknowledge the disclaimer to continue.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-2 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-semibold">Your Full Name</Label>
                        <Input
                            id="name"
                            placeholder="Enter your name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-white/5 border-white/10"
                            autoFocus
                        />
                    </div>

                    <div className="p-4 bg-muted/30 rounded-lg border border-border text-xs text-muted-foreground space-y-2">
                        <p>
                            <strong>Disclaimer:</strong> LASA Finance is an analytics and educational platform. We provide market tools and data visualization. We are <strong>NOT</strong> a SEBI-registered investment adviser.
                        </p>
                        <p>
                            No content here constitutes investment advice. Always consult a qualified financial advisor before investing.
                        </p>
                    </div>

                    <div className="flex items-start space-x-3 pt-1">
                        <Checkbox
                            id="terms"
                            checked={accepted}
                            onCheckedChange={(checked) => setAccepted(checked as boolean)}
                            className="mt-1"
                        />
                        <div className="grid gap-1.5 leading-none">
                            <Label
                                htmlFor="terms"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                I understand and agree
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                I acknowledge that this platform is for analytics purposes only.
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="sm:justify-between items-center">
                    <p className="text-[10px] text-muted-foreground text-left flex-1">
                        Your name and acceptance will be logged for compliance.
                    </p>
                    <Button
                        type="button"
                        onClick={handleAccept}
                        disabled={!accepted || !name.trim() || loading}
                        className="w-full sm:w-auto min-w-[120px]"
                    >
                        {loading ? "Processing..." : (
                            <>
                                Accept & Enter <ShieldCheck className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
