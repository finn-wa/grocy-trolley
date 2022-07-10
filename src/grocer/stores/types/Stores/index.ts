import { GrocerVendor } from "@gt/grocer/models";

export const GROCER_VENDOR_CODES = ["cd", "fc", "nw", "pns", "sv", "tw"] as const;
export type GrocerVendorCode = typeof GROCER_VENDOR_CODES[number];
export const GROCER_VENDOR_CODE_MAP: Record<GrocerVendorCode, GrocerVendor> = {
  cd: "Countdown",
  fc: "Fresh Choice",
  nw: "New World",
  pns: "PAK'nSAVE",
  sv: "Super Value",
  tw: "The Warehouse",
};
export type Store = Readonly<{
  id: number;
  name: string;
  vendor_code: GrocerVendorCode;
}>;

export type Stores = Store[];
