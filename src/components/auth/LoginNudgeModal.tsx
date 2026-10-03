import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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

const NUDGE_DELAY_MS = 5 * 60 * 1000;
// localStorage (not sessionStorage) so a new tab or browser restart doesn't reset the 5 minutes
const GUEST_START_KEY = "guest_session_start";

function readGuestStart(): number {
  try {
    return Number(localStorage.getItem(GUEST_START_KEY)) || 0;
  } catch {
    return 0;
  }
}

function writeGuestStart(value: number | null) {
  try {
    if (value === null) localStorage.removeItem(GUEST_START_KEY);
    else localStorage.setItem(GUEST_START_KEY, String(value));
  } catch {
    // Storage unavailable: the timer then restarts on each page load
  }
}

/**
 * After 5 minutes of guest browsing, requires sign-in: the page behind is greyed out and the
 * prompt can't be dismissed. Sign-in goes through the login page so the disclaimer opt-in and
 * profile details are collected, then returns the user to the page they were on.
 */
export function LoginNudgeModal() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (user) {
      writeGuestStart(null);
      setOpen(false);
      return;
    }

    let start = readGuestStart();
    if (!start) {
      start = Date.now();
      writeGuestStart(start);
    }

    const remaining = NUDGE_DELAY_MS - (Date.now() - start);
    if (remaining <= 0) {
      setOpen(true);
      return;
    }
    const timer = setTimeout(() => setOpen(true), remaining);
    return () => clearTimeout(timer);
  }, [loading, user]);

  const goToLogin = () => {
    navigate("/login", { state: { from: location.pathname + location.search } });
  };

  if (user) return null;

  return (
    <Dialog open={open} onOpenChange={() => { /* can't be dismissed */ }}>
      <DialogContent
        className="sm:max-w-md"
        overlayClassName="bg-black/85 backdrop-blur-sm"
        hideCloseButton
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="items-center text-center">
          <div className="mb-2 h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-lg font-bold">Please sign in to continue</DialogTitle>
          <DialogDescription>
            Your free guest preview has ended. Sign in with Google (it's free) to keep using the LASA dashboard.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={goToLogin} className="w-full gap-2">
            <Chrome className="w-4 h-4" />
            Sign in with Google
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default LoginNudgeModal;
