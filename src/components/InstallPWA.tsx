import React, { useState, useEffect } from "react";
import { Download, CheckCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

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
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === "accepted") {
          setDeferredPrompt(null);
        }
      } catch (err) {
        console.error("Install prompt error:", err);
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <Button
        onClick={handleInstallClick}
        type="button"
        className={
          variant === "landing"
            ? (className || "group relative px-8 py-6 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-full text-lg font-semibold transition-all hover:scale-105 active:scale-95 shadow-xl shadow-purple-900/40 border border-purple-400/40 flex items-center gap-3 cursor-pointer z-50")
            : (className || "relative flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs px-3 py-1.5 rounded-xl shadow-lg shadow-purple-500/25 border border-purple-400/30 transition-all duration-200 cursor-pointer")
        }
        title="Install LaSa Research App"
      >
        <Download className="w-5 h-5 animate-bounce text-purple-200" />
        <span>Install App</span>
      </Button>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-zinc-950 text-white border-zinc-800 max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-purple-400">
              <Download className="w-5 h-5" /> Install LaSa Research Portal
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-sm mt-1">
              Follow these simple steps to install the app on your current browser/device:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4 text-sm text-zinc-300">
            <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl">
              <p className="font-semibold text-purple-300 mb-1">💻 Microsoft Edge / Chrome Desktop:</p>
              <ol className="list-disc list-inside space-y-1 text-xs text-zinc-400">
                <li>Look at the top-right corner of your browser address bar.</li>
                <li>Click the 3 dots menu <strong className="text-white">(...)</strong> or App Install icon.</li>
                <li>Select <strong className="text-white font-medium">"Apps"</strong> → <strong className="text-white font-medium">"Install LaSa Research Portal"</strong>.</li>
              </ol>
            </div>

            <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl">
              <p className="font-semibold text-indigo-300 mb-1">📱 Android Phone (Chrome / Edge):</p>
              <ol className="list-disc list-inside space-y-1 text-xs text-zinc-400">
                <li>Tap the 3 dots menu at the top-right of your screen.</li>
                <li>Tap <strong className="text-white font-medium">"Add to Home screen"</strong> or <strong className="text-white font-medium">"Install app"</strong>.</li>
              </ol>
            </div>

            <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl">
              <p className="font-semibold text-pink-300 mb-1">🍎 iPhone / iPad (Safari):</p>
              <ol className="list-disc list-inside space-y-1 text-xs text-zinc-400">
                <li>Tap the <strong className="text-white font-medium">Share icon</strong> at the bottom of Safari.</li>
                <li>Scroll down and tap <strong className="text-white font-medium">"Add to Home Screen"</strong>.</li>
              </ol>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setShowModal(false)}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl"
            >
              Got it!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
