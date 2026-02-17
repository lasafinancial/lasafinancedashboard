"use client";

import { useState } from "react";
import { Globe, Check } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { COUNTRIES, type CountryId } from "./CountrySelectionModal";

interface CountrySelectorProps {
    selectedCountry: CountryId;
    onCountryChange: (countryId: CountryId) => void;
    showNameOnMobile?: boolean;
}

export function CountrySelector({ selectedCountry, onCountryChange, showNameOnMobile = false }: CountrySelectorProps) {
    const currentCountry = COUNTRIES.find(c => c.id === selectedCountry) || COUNTRIES[0];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/40 transition-all duration-200 group">
                    <span className="text-xl">{currentCountry.flag}</span>
                    <span className={`text-sm font-semibold ${showNameOnMobile ? "" : "hidden sm:inline"}`}>{currentCountry.name}</span>
                    <Globe className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-background/95 backdrop-blur-xl border-white/20">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Select Region
                </div>
                {COUNTRIES.map((country) => (
                    <DropdownMenuItem
                        key={country.id}
                        onClick={() => onCountryChange(country.id)}
                        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
                    >
                        <span className="text-2xl">{country.flag}</span>
                        <div className="flex-1">
                            <div className="font-semibold text-sm">{country.name}</div>
                            <div className="text-xs text-muted-foreground">{country.marketName}</div>
                        </div>
                        {country.id === selectedCountry && (
                            <Check className="w-4 h-4 text-primary" />
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
