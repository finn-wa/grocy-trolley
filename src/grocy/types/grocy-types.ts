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
  return Number(value);
}

export function parseOptionalNumber(value?: string | null) {
  return parseIfDefined(value, parseNumber);
}

/**
 * Some Grocy IDs are marked as required but may contain empty strings.
 * This method converts empty strings to null.
 * @param value The ID to parse
 * @returns The ID or null if it was an empty string
 */
export function parseOptionalId(value: string): string | null {
  return value === "" ? null : value;
}

// sorry in advance, got carried away with conditional types
// prettier-ignore
type WithValuesOfType<T, KeysToCast extends keyof T, ValueType> = {
  [K in keyof T]: K extends KeysToCast
    ? undefined extends T[K]
      ? null extends T[K]
        ? ValueType | undefined | null
        : ValueType
      : null extends T[K]
        ? ValueType | null
        : ValueType
    : T[K];
};
type WithBooleans<T, K extends keyof T> = WithValuesOfType<T, K, boolean>;
type WithNumbers<T, K extends keyof T> = WithValuesOfType<T, K, number>;

type WithOptionalIds<T, OptionalIdKeys extends keyof T> = {
  [K in keyof T]: K extends OptionalIdKeys ? string | null : T[K];
};

/* eslint-disable */
function mapEntries(
  obj: Record<string, any>,
  keys: (string | number | symbol)[],
  valueMapper: (v: any) => any
) {
  const mapped: any = { ...obj };
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
  return mapEntries(obj, keys, parseOptionalBoolean) as WithBooleans<T, BooleanKeys>;
}

export function withNumbers<T, NumberKeys extends keyof T>(
  obj: T,
  keys: NumberKeys[]
): WithNumbers<T, NumberKeys> {
  return mapEntries(obj, keys, parseOptionalNumber) as WithNumbers<T, NumberKeys>;
}

export function withOptionalIds<T, OptionalIdKeys extends keyof T>(
  obj: T,
  keys: OptionalIdKeys[]
): WithOptionalIds<T, OptionalIdKeys> {
  return mapEntries(obj, keys, parseOptionalId) as WithOptionalIds<T, OptionalIdKeys>;
}

export function updateTypes<
  T,
  BooleanKeys extends keyof T,
  NumberKeys extends keyof T,
  OptionalIdKeys extends keyof T
>(
  obj: T,
  config: {
    booleans?: BooleanKeys[];
    numbers?: NumberKeys[];
    optionalIds?: OptionalIdKeys[];
  }
) {
  const boolified = withBooleans(obj, config.booleans ?? []);
  const numberified = withNumbers(boolified, config.numbers ?? []);
  return withOptionalIds(numberified, config.optionalIds ?? []);
}
