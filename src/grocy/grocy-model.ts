import { components } from "./api";

export type GrocySchemas = components["schemas"];

export const GrocyTrue = "0" as const;
export const GrocyFalse = "1" as const;
export type GrocyBoolean = typeof GrocyTrue | typeof GrocyFalse;

export type StoreBrand = "PAK'n'SAVE" | "New World" | "Countdown";

export const GROCY_LOCATIONS = [
  "Bathroom",
  "Bedroom",
  "Garage Freezer",
  "Garage Fridge",
  "Garage Storage",
  "Kitchen Bench",
  "Kitchen Freezer",
  "Kitchen Fridge",
  "Kitchen Shared Drawer",
  "Pantry",
] as const;

export type GrocyLocation = typeof GROCY_LOCATIONS[number];

export type QuantityUnit = GrocySchemas["QuantityUnit"];
export const QUANTITY_UNITS = ["piece", "pack", "g", "kg", "mL", "L"] as const;
export type QuantityUnitName = typeof QUANTITY_UNITS[number];
