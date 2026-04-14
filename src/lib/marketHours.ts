/**
 * Utility to determine if the Indian Stock Market (NSE/BSE) is currently open.
 * Market Hours: Monday - Friday, 09:15 AM to 03:30 PM IST.
 */
export function isMarketOpen(): boolean {
  const now = new Date();
  
  // Convert standard JS Date to IST (Asia/Kolkata)
  // This works consistently across local developer machines and cloud servers (Vercel)
  const istDateString = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  const istDate = new Date(istDateString);
  
  const day = istDate.getDay(); // 0 (Sun) to 6 (Sat)
  const hours = istDate.getHours();
  const minutes = istDate.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  const marketStart = 9 * 60 + 15; // 09:15 AM
  const marketEnd = 15 * 60 + 30;   // 03:30 PM

  // Check if it's a weekday (Monday=1, Friday=5)
  const isWeekday = day >= 1 && day <= 5;
  
  // Check if current time is within market hours
  const isWithinHours = timeInMinutes >= marketStart && timeInMinutes <= marketEnd;

  return isWeekday && isWithinHours;
}

/**
 * Helper to get the current time in IST formatted for logging
 */
export function getISTLogTime(): string {
  return new Date().toLocaleString("en-US", { 
    timeZone: "Asia/Kolkata",
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: false 
  }) + " IST";
}
