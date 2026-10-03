export const FEATURE_FLAGS = {
    // Login options. Google sign-in is always shown; set these to true to bring the others back.
    ENABLE_PHONE_LOGIN: false, // Phone + OTP
    ENABLE_EMAIL_LOGIN: false, // Email magic link

    // When true, skips the login screen and logs in as a "Beta User"
    BYPASS_LOGIN: false,

    // Sir's Desk and Admin updates are independent and always active
    ENABLE_DAILY_UPDATES: true,

    // NEW: Control the onboarding steps
    ENABLE_TRADER_TYPE_ONBOARDING: false, // Set to false to skip trader type selection
    ENABLE_LEGAL_DISCLAIMER: false,      // Legal disclaimer modal after sign-in. Off: the login page shows the disclaimer and signing in records acceptance
    ENABLE_ONBOARDING: false,            // Onboarding slides / trader type / profile popups after sign-in. Off: users go straight to the dashboard

    // NEW: Access Control System
    ENABLE_TIER_RESTRICTIONS: true, // When false, all users get ELITE features. When true, enforces free/pro/elite restrictions.
    FORCE_ELITE_FOR_ALL: false,      // When true, forces every login to ELITE tier. When false, forces everyone to FREE.

    // Disabled Screeners for Dashboard Performance & Scalability
    ENABLE_BREAKOUT_SCREENER: false,       // Disables BREAKOUT (nearResistance) screener
    ENABLE_REVERSAL_SCREENER: false,       // Disables REVERSAL (supportReversal) screener
    ENABLE_REACTION_ZONE_SCREENER: false,   // Disables REACTION ZONE (reactionZone) screener
    ENABLE_NEW_BREAKOUTS_SCREENER: false,   // Disables NEW BREAKOUTS (newBreakouts) screener
};

