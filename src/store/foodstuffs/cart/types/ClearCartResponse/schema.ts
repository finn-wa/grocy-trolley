import { ajv, getRequiredSchema } from "@gt/jtd/ajv";
import { JTDSchemaType } from "ajv/dist/jtd";
import { ClearCartResponse } from ".";

/**
 * This will cause a TypeScript compiler error if the ClearCartResponse type defined in
 * index.ts is modified in a way that makes it incompatible with the schema.
 */
export const schema: JTDSchemaType<ClearCartResponse> = {
  properties: { success: { type: "boolean" } },
};

/**
 * The key used to index the ClearCartResponse schema with ajv
 */
export const key = "src/store/foodstuffs/cart/ClearCartResponse";

/**
 * Calls {@link ajv.getSchema} with the ClearCartResponse schema {@link key}. The schema is
 * compiled on the first call to  {@link ajv.getSchema}.
 *
 * @returns A validate() function for ClearCartResponse
 */
export const getClearCartResponseSchema = () => getRequiredSchema<ClearCartResponse>(key);

// Register schema with ajv instance
ajv.addSchema(schema, key);
