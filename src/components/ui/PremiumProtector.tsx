import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Lock } from 'lucide-react';
import { FEATURE_FLAGS } from '@/lib/featureFlags';

interface PremiumProtectorProps {
    children: React.ReactNode;
    requiredTier?: 'pro' | 'elite';
    blurLevel?: 'sm' | 'md' | 'lg';
    hideContent?: boolean; // If true, completely removes children from DOM instead of blurring
    title?: string;
    description?: string;
    isLocked?: boolean; // For custom lock conditions (like view limits)
}

export const PremiumProtector = ({
    children,
    requiredTier = 'pro',
    blurLevel = 'md',
    hideContent = false,
    title = "Premium Feature",
    description = "Please upgrade your account to access this feature.",
    isLocked,
}: PremiumProtectorProps) => {
    const { isPro, isElite, isFree } = useAuth();

    // If restrictions are globally disabled, just pass through
    if (!FEATURE_FLAGS.ENABLE_TIER_RESTRICTIONS) {
        return <>{children}</>;
    }

    let hasAccess = false;

    if (isLocked !== undefined) {
        hasAccess = !isLocked;
    } else if (requiredTier === 'pro') {
        hasAccess = isPro || isElite;
    } else if (requiredTier === 'elite') {
        hasAccess = isElite;
    }

    if (hasAccess) {
        return <>{children}</>;
    }

    // Handle NO ACCESS state

    if (hideContent) {
        return (
            <div className="w-full flex-1 flex flex-col items-center justify-center p-8 bg-black/40 border border-white/5 rounded-2xl min-h-[300px]">
                <div className="h-16 w-16 bg-black/50 border border-white/10 rounded-2xl flex items-center justify-center mb-6 shadow-2xl">
                    <Lock className="w-8 h-8 text-white/50" />
                </div>
                <h3 className="text-xl font-bold tracking-tight mb-2 text-center text-white/90">{title}</h3>
                <p className="text-sm text-white/50 max-w-sm text-center font-medium leading-relaxed">{description}</p>
            </div>
        );
    }

    const blurClasses = {
        sm: 'blur-sm',
        md: 'blur-md',
        lg: 'blur-lg'
    };

    return (
        <div className="relative group overflow-hidden rounded-2xl">
            {/* Blurred Content */}
            <div className={`select-none pointer-events-none ${blurClasses[blurLevel]} opacity-60 transition-opacity duration-500`}>
                {children}
            </div>

            {/* Lock Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/40 backdrop-blur-[2px] z-10 transition-all duration-500 hover:bg-background/30 p-4">
                <div className="h-16 w-16 bg-background border border-white/10 rounded-2xl flex items-center justify-center mb-6 shadow-2xl transform transition-transform group-hover:scale-110 duration-500">
                    <Lock className="w-8 h-8 text-primary shadow-primary/20" />
                </div>

                <h3 className="text-xl font-bold tracking-tight mb-3 text-center drop-shadow-lg">{title}</h3>

                <p className="text-sm text-muted-foreground/90 max-w-sm text-center font-medium leading-relaxed mb-6 drop-shadow-md bg-background/50 py-2 px-4 rounded-full border border-white/5">
                    {description}
                </p>

                <div className="px-6 py-2.5 rounded-full bg-primary/20 border border-primary/30 text-primary text-sm font-bold tracking-wide hover:bg-primary hover:text-white transition-all duration-300 cursor-pointer shadow-lg shadow-primary/20 flex items-center gap-2">
                    <span>{requiredTier === 'pro' ? 'Upgrade to PRO' : 'Upgrade to ELITE'}</span>
                </div>
            </div>
        </div>
    );
};
