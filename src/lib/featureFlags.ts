export const FEATURE_FLAGS = {
    // Set to false to hide Phone/OTP login and fall back to Google/Email
    ENABLE_PHONE_LOGIN: true,

    // When true, skips the login screen and logs in as a "Beta User"
    BYPASS_LOGIN: false,

    // Sir's Desk and Admin updates are independent and always active
    ENABLE_DAILY_UPDATES: true,

    // NEW: Control the onboarding steps
    ENABLE_TRADER_TYPE_ONBOARDING: false, // Set to false to skip trader type selection
    ENABLE_LEGAL_DISCLAIMER: false,       // Set to false to skip the legal disclaimer modal
};
