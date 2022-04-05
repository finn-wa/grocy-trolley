/**
 * Filters an array of objects for uniqueness based on the value of a specified
 * property. Items later in the array take precedence.
 * @param array Array of objects
 * @param property Property name for unique key
 * @returns Unique array of objects
 */
export function uniqueByProperty<T, K extends keyof T>(array: T[], property: K): T[] {
  const entries: [T[K], T][] = array.map((obj) => [obj[property], obj]);
  return Array.from(new Map(entries).values());
}
