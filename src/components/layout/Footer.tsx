import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full border-t border-white/10 bg-black/20 backdrop-blur-xl mt-auto">
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col gap-6">
                    {/* Main Disclaimer Section */}
                    <div className="rounded-xl bg-primary/5 border border-primary/10 p-4 md:p-6">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2 text-primary/80">
                                <ShieldAlert className="w-5 h-5" />
                                <span className="text-sm font-semibold uppercase tracking-wider">Disclaimer</span>
                            </div>
                            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                                <p>
                                    This platform provides market analytics and educational information only.
                                    It does not constitute investment advice, recommendations, or an offer to buy or sell securities.
                                </p>
                                <p className="font-medium text-foreground/80">
                                    Users should consult a SEBI-registered investment adviser before making investment decisions.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Links & Copyright */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground border-t border-white/5 pt-6">
                        <p>© {currentYear} LASA Finance. All rights reserved.</p>
                        <div className="flex items-center gap-6">
                            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
                            <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
                            <Link to="#" className="hover:text-primary transition-colors">Contact Support</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
