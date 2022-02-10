import { components } from "./api";

export const GrocyTrue = "0" as const;
export const GrocyFalse = "1" as const;
export type GrocyBoolean = typeof GrocyTrue | typeof GrocyFalse;

export type StoreBrand = "PAK'n'SAVE" | "New World" | "Countdown";
