export const GROCER_URL = "https://grocer.nz";
export const GROCER_VENDORS = [
  "Countdown",
  "Fresh Choice",
  "New World",
  "PAK'nSAVE",
  "Super Value",
  "The Warehouse",
] as const;
export type GrocerVendor = typeof GROCER_VENDORS[number];

type UnfranchisedStores = "The Warehouse";
export type GrocerStoreName =
  | `${Exclude<GrocerVendor, UnfranchisedStores>} ${string}`
  | UnfranchisedStores;
