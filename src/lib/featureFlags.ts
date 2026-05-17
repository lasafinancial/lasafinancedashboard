export const FEATURE_FLAGS = {
    // Set to false to hide Phone/OTP login and fall back to Google/Email
    ENABLE_PHONE_LOGIN: true,

    // When true, skips the login screen and logs in as a "Beta User"
    BYPASS_LOGIN: true,

    // Sir's Desk and Admin updates are independent and always active
    ENABLE_DAILY_UPDATES: true,

    // NEW: Control the onboarding steps
    ENABLE_TRADER_TYPE_ONBOARDING: false, // Set to false to skip trader type selection
    ENABLE_LEGAL_DISCLAIMER: true,       // Set to false to skip the legal disclaimer modal

    // NEW: Access Control System
    ENABLE_TIER_RESTRICTIONS: false, // When false, all users get ELITE features. When true, enforces free/pro/elite restrictions.
    FORCE_ELITE_FOR_ALL: true,      // When true, forces every login to ELITE tier. When false, forces everyone to FREE.
};
