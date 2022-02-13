import { components } from "./api";

export type GrocySchemas = components["schemas"];

export const GrocyTrue = "0" as const;
export const GrocyFalse = "1" as const;
export type GrocyBoolean = typeof GrocyTrue | typeof GrocyFalse;
