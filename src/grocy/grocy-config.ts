import { FoodstuffsCategory, FOODSTUFFS_CATEGORIES } from "@gt/store/foodstuffs/models";
import { GrocySchemas } from "./types/grocy-types";

export type StoreBrand = "PNS" | "NW" | "CD";

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
export const QUANTITY_UNITS = ["ea", "pk", "g", "kg", "mL", "L"] as const;
export type QuantityUnitName = typeof QUANTITY_UNITS[number];

export const GROCY_PRODUCT_GROUPS = FOODSTUFFS_CATEGORIES;
export type GrocyProductGroup = FoodstuffsCategory;
