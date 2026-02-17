"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { Globe } from "lucide-react";

export type CountryId = "india" | "dubai" | "usa";

interface Country {
    id: CountryId;
    name: string;
    flag: string;
    marketName: string;
    currency: string;
}

const COUNTRIES: Country[] = [
    {
        id: "india",
        name: "India",
        flag: "🇮🇳",
        marketName: "Indian Markets",
        currency: "₹ INR",
    },
    {
        id: "dubai",
        name: "Dubai",
        flag: "🇦🇪",
        marketName: "UAE Markets",
        currency: "د.إ AED",
    },
    {
        id: "usa",
        name: "USA",
        flag: "🇺🇸",
        marketName: "US Markets",
        currency: "$ USD",
    },
];

interface CountrySelectionModalProps {
    isOpen: boolean;
    onSelect: (countryId: CountryId) => void;
}

export function CountrySelectionModal({ isOpen, onSelect }: CountrySelectionModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={() => { }}>
            <DialogContent
                className="sm:max-w-4xl p-0 gap-0 [&>button:last-child]:hidden"
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <div className="p-8 space-y-8">
                    {/* Header */}
                    <div className="text-center space-y-3">
                        <div className="flex justify-center">
                            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
                                <Globe className="w-10 h-10 text-primary" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight">Select Your Region</h2>
                        <p className="text-muted-foreground text-lg">
                            Choose your market to get started with personalized analytics
                        </p>
                    </div>

                    {/* Country Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {COUNTRIES.map((country, index) => (
                            <motion.button
                                key={country.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                onClick={() => onSelect(country.id)}
                                className="group relative p-8 rounded-2xl border-2 border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-primary/40 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(var(--primary),0.2)]"
                            >
                                {/* Flag */}
                                <div className="text-7xl mb-4 group-hover:scale-110 transition-transform duration-300">
                                    {country.flag}
                                </div>

                                {/* Country Name */}
                                <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
                                    {country.name}
                                </h3>

                                {/* Market Name */}
                                <p className="text-sm text-muted-foreground mb-3">
                                    {country.marketName}
                                </p>

                                {/* Currency */}
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-muted-foreground">
                                    {country.currency}
                                </div>

                                {/* Hover Glow Effect */}
                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:to-primary/10 transition-all duration-300 pointer-events-none" />
                            </motion.button>
                        ))}
                    </div>

                    {/* Footer Note */}
                    <p className="text-center text-xs text-muted-foreground/60 italic">
                        You can change your region anytime from the top-right corner
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export { COUNTRIES };
