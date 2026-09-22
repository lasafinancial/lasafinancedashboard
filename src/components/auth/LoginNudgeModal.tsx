import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Chrome, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const NUDGE_DELAY_MS = 5 * 60 * 1000;
const SESSION_START_KEY = "guest_session_start";
const DISMISSED_KEY = "login_nudge_dismissed";

/** Nudges anonymous visitors to sign in with Google after 5 minutes of guest browsing. Dismissible; won't re-ask this session. */
export function LoginNudgeModal() {
  const { user, loading, signInWithGoogle } = useAuth();
  const [open, setOpen] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (loading || user) return;
    if (sessionStorage.getItem(DISMISSED_KEY)) return;

    let start = Number(sessionStorage.getItem(SESSION_START_KEY));
    if (!start) {
      start = Date.now();
      sessionStorage.setItem(SESSION_START_KEY, String(start));
    }

    const remaining = NUDGE_DELAY_MS - (Date.now() - start);
    if (remaining <= 0) {
      setOpen(true);
      return;
    }
    const timer = setTimeout(() => setOpen(true), remaining);
    return () => clearTimeout(timer);
  }, [loading, user]);

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, "true");
    setOpen(false);
  };

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    try {
      await signInWithGoogle();
      toast.success("Signed in! Enjoy the full experience.");
      setOpen(false);
    } catch (error) {
      console.error("Login nudge Google sign-in error:", error);
      toast.error("Sign-in failed. Please try again.");
    } finally {
      setSigningIn(false);
    }
  };

  if (user) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleDismiss(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <div className="mb-2 h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-lg font-bold">Still browsing as a guest?</DialogTitle>
          <DialogDescription>
            Sign in with Google — it's free — so we can confirm you're a real user and give you a seamless, personalized experience.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={handleGoogleSignIn} disabled={signingIn} className="w-full gap-2">
            <Chrome className="w-4 h-4" />
            {signingIn ? "Signing in..." : "Continue with Google"}
          </Button>
          <Button variant="ghost" onClick={handleDismiss} className="w-full text-muted-foreground">
            Maybe later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default LoginNudgeModal;
