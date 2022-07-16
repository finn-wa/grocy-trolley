export function pathSafeDate() {
  return new Date().toISOString().replaceAll(":", "_");
}

/**
 * Converts a date string from YYYY-MM-DD HH:MM:SS to YYYY-MM-DD
 * @param grocyDate date string from grocy API
 * @returns date string in YYYY-MM-DD format
 */
export function toDateString(grocyDate: string) {
  return grocyDate.slice(0, 10);
}
