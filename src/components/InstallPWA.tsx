import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface InstallPWAProps {
  className?: string;
  variant?: "default" | "landing";
}

export function InstallPWA({ className, variant = "default" }: InstallPWAProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already in standalone app mode
    if (window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert(
        "To install LaSa Research Portal on your device:\n\n" +
        "• Chrome / Edge: Click browser menu (3 dots) -> Select 'Install LASA Finance' or 'Install App'\n" +
        "• Mobile (Android): Tap menu (3 dots) -> Select 'Install App' or 'Add to Home screen'\n" +
        "• iPhone / iOS (Safari): Tap the Share button -> Select 'Add to Home Screen'"
      );
      return;
    }

    await deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === "accepted") {
      setDeferredPrompt(null);
      setIsInstalled(true);
    }
  };

  if (isInstalled) return null;

  if (variant === "landing") {
    return (
      <Button
        onClick={handleInstallClick}
        className={className || "group relative px-8 py-6 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-full text-lg font-semibold transition-all hover:scale-105 active:scale-95 shadow-xl shadow-purple-900/40 border border-purple-400/40 flex items-center gap-3"}
      >
        <Download className="w-5 h-5 animate-bounce text-purple-200" />
        <span>Install App</span>
      </Button>
    );
  }

  return (
    <Button
      onClick={handleInstallClick}
      size="sm"
      className={className || "relative flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs px-3 py-1.5 rounded-xl shadow-lg shadow-purple-500/25 border border-purple-400/30 transition-all duration-200"}
      title="Install LaSa Research App"
    >
      <Download className="h-3.5 w-3.5 animate-bounce" />
      <span>Install App</span>
    </Button>
  );
}
