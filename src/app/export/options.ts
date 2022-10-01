export const EXPORT_DESTINATIONS = ["pns", "grocer"] as const;
export type ExportDestination = typeof EXPORT_DESTINATIONS[number];

export interface ExportOptions {
  destination: ExportDestination;
}
