export function pathSafeDate() {
  return new Date().toISOString().replaceAll(":", "_");
}
