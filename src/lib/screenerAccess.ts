// Screeners that require a paid plan. Shared by the Screeners page and the navbar dropdown
// so both show the same Paid / Free badge.
export const PAID_SCREENER_PATHS = new Set<string>([
  "/screeners/recommendations",
  "/screeners/weekly-recommendations",
]);

export const isPaidScreener = (path: string) => PAID_SCREENER_PATHS.has(path);
