import { components } from "./api";

export type GrocySchemas = components["schemas"];

export const GrocyTrue = "1" as const;
export const GrocyFalse = "0" as const;
export type GrocyBoolean = typeof GrocyTrue | typeof GrocyFalse;

export function toBoolean(value: GrocyBoolean | undefined | null): boolean {
  return value === GrocyTrue;
}
