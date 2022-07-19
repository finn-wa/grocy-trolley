export function pathSafeDate() {
  return new Date().toISOString().replaceAll(":", "_");
}

/**
 * Converts a date string from YYYY-MM-DD HH:MM:SS to YYYY-MM-DD
 * @param grocyDate date string from grocy API
 * @returns date string in YYYY-MM-DD format
 */
export function grocyShortDate(grocyDate: string) {
  return grocyDate.slice(0, 10);
}

/**
 * Converts a date to a string to YYYY-MM-DD format
 * @param date date to format
 * @returns date in YYYY-MM-DD format
 */
export function shortDate(date: Date): string {
  const padZero = (num: number) => num.toString().padStart(2, "0");
  const yyyy = date.getFullYear();
  const mm = padZero(date.getMonth() + 1);
  const dd = padZero(date.getDate());
  return `${yyyy}-${mm}-${dd}`;
}
