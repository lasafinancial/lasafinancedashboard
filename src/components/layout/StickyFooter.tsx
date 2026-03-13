import { ShieldAlert } from "lucide-react";

export function StickyFooter() {
    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] bg-black/80 backdrop-blur-md border-t border-white/10 px-4 py-2.5">
            <div className="container mx-auto flex items-center gap-3">
                <ShieldAlert className="w-4 h-4 text-warning shrink-0" />
                <p className="text-[10px] md:text-xs text-muted-foreground leading-tight">
                    <span className="font-bold text-foreground">LASA Finance</span> is an analytical platform providing algorithm and AI-generated market data for educational and informational purposes only. All content on this platform does not constitute investment advice, research, or a recommendation to buy or sell any security. Past analytical patterns do not guarantee future results. Users are advised to consult a SEBI-registered financial advisor before making any investment decisions. LASA Finance and its operators are not liable for any financial gains or losses arising from use of this platform.
                </p>
            </div>
        </div>
    );
}
