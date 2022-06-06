export const GROCER_URL = "https://grocer.nz";
export const GROCER_STORE_BRANDS = [
  "Countdown",
  "New World",
  "PAK'nSAVE",
  "The Warehouse",
] as const;
export type GrocerStoreBrand = typeof GROCER_STORE_BRANDS[number];

type UnfranchisedStores = "The Warehouse";
export type GrocerStoreName =
  | `${Exclude<GrocerStoreBrand, UnfranchisedStores>} ${string}`
  | UnfranchisedStores;
