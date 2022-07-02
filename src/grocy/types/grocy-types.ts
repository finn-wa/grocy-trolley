import { ajv, getRequiredSchema } from "@gt/jtd/ajv";
import { JTDSchemaType } from "ajv/dist/core";
import { components } from "../api";

export type GrocySchemas = components["schemas"];
export type GrocyEntity = GrocySchemas["ExposedEntity"];
export const GrocyTrue = "1" as const;
export const GrocyFalse = "0" as const;
export type GrocyBoolean = typeof GrocyTrue | typeof GrocyFalse;
export const GrocyBooleanSchema: JTDSchemaType<GrocyBoolean> = { enum: [GrocyTrue, GrocyFalse] };

export type QuantityUnitConversion = GrocySchemas["QuantityUnitConversion"];

export interface CreatedObjectId {
  created_object_id: string;
}

const createdObjectIdSchema: JTDSchemaType<CreatedObjectId> = {
  properties: {
    created_object_id: { type: "string" },
  },
};
const createdObjectIdKey = "src/grocy/api/CreatedObjectId";
ajv.addSchema(createdObjectIdSchema, createdObjectIdKey);

export const getCreatedObjectIdSchema = () =>
  getRequiredSchema<CreatedObjectId>(createdObjectIdKey);

export function parseIfDefined<T>(
  value: string | null | undefined,
  parse: (value: string) => T
): T | null | undefined {
  if (value === null || value === undefined) {
    return value;
  }
  if (value === "") {
    return null;
  }
  return parse(value);
}

export function parseBoolean(value: string): boolean {
  return value === GrocyTrue;
}

export function parseOptionalBoolean(value?: string | null): boolean | null | undefined {
  return parseIfDefined(value, parseBoolean);
}

export function parseNumber(value: string): number {
  return value.includes(".") ? parseFloat(value) : parseInt(value);
}

export function parseOptionalNumber(value?: string | null) {
  return parseIfDefined(value, parseNumber);
}

type WithBooleans<T, BooleanKeys extends keyof T> = {
  [K in keyof T]: K extends BooleanKeys ? boolean : T[K];
};
type WithNumbers<T, NumberKeys extends keyof T> = {
  [K in keyof T]: K extends NumberKeys ? number : T[K];
};

/* eslint-disable */
function updateEntries(
  obj: Record<string, any>,
  keys: (string | number | symbol)[],
  valueMapper: (v: any) => any
) {
  const mapped: any = {};
  keys
    .filter((key) => key in obj)
    .forEach((key) => {
      mapped[key] = valueMapper(obj[key as string]);
    });
  return mapped;
}
/* eslint-enable */

export function withBooleans<T, BooleanKeys extends keyof T>(
  obj: T,
  keys: BooleanKeys[]
): WithBooleans<T, BooleanKeys> {
  return updateEntries(obj, keys, parseOptionalBoolean) as WithBooleans<T, BooleanKeys>;
}

export function withNumbers<T, NumberKeys extends keyof T>(
  obj: T,
  keys: NumberKeys[]
): WithNumbers<T, NumberKeys> {
  return updateEntries(obj, keys, parseOptionalNumber) as WithNumbers<T, NumberKeys>;
}

export function updateTypes<T, BooleanKeys extends keyof T, NumberKeys extends keyof T>(
  obj: T,
  {
    booleans,
    numbers,
  }: {
    booleans: BooleanKeys[];
    numbers: NumberKeys[];
  }
) {
  return withBooleans(withNumbers(obj, numbers), booleans);
}
