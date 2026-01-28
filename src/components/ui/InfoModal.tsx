import { useState } from "react";
import { Info, X, Play } from "lucide-react";

interface InfoModalProps {
  title: string;
  sections: {
    heading: string;
    content: string;
  }[];
  videoLink?: string;
  layout?: "vertical" | "horizontal";
}

export function InfoModalTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 p-2.5 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 hover:border-primary/40 hover:scale-105 transition-all duration-200 group shadow-[0_0_15px_rgba(var(--primary),0.1)]"
      title="Learn more"
    >
      <Info className="w-5 h-5 text-primary/70 group-hover:text-primary transition-colors" />
    </button>
  );
}

export function InfoModal({ title, sections, videoLink, isOpen, onClose, layout = "vertical" }: InfoModalProps & { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  const isHorizontal = layout === "horizontal";

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className={`relative w-full max-h-[85vh] overflow-y-auto bg-background/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl ${
          isHorizontal ? "max-w-5xl" : "max-w-2xl"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between p-4 border-b border-white/10 bg-background/95 backdrop-blur-xl">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className={`p-6 ${isHorizontal ? "grid grid-cols-2 gap-6" : "space-y-6"}`}>
          {sections.map((section, index) => (
            <div key={index} className="space-y-2">
              <h4 className="text-sm font-semibold text-primary uppercase tracking-wide">{section.heading}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {section.content}
              </p>
            </div>
          ))}

          {videoLink && (
            <div className={`space-y-4 ${isHorizontal ? "col-span-2" : ""}`}>
              <h4 className="text-sm font-semibold text-primary uppercase tracking-wide flex items-center gap-2">
                <Play className="w-4 h-4" />
                Video Tutorial
              </h4>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs text-muted-foreground mb-3">Watch our detailed explanation video:</p>
                <a 
                  href={videoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/20 border border-primary/30 text-primary text-sm font-medium hover:bg-primary/30 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Watch Video Guide
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function useInfoModal() {
  const [showModal, setShowModal] = useState(false);
  return {
    showModal,
    openModal: () => setShowModal(true),
    closeModal: () => setShowModal(false),
  };
}
