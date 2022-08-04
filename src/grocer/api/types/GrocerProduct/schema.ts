import { ajv, getRequiredSchema } from "@gt/jtd/ajv";
import { generateTypes } from "@gt/jtd/generate-types";
import { JTDSchemaType } from "ajv/dist/jtd";
import { GrocerProduct } from ".";
import samples from "./samples.json";

/**
 * This will cause a TypeScript compiler error if the GrocerProduct type defined in
 * index.ts is modified in a way that makes it incompatible with the schema.
 */
export const schema: JTDSchemaType<GrocerProduct> = {
  properties: {
    brand: { type: "string" },
    id: { type: "float64" },
    name: { type: "string" },
    prices: {
      elements: {
        properties: {
          multibuy_limit: { nullable: true, type: "float64" },
          multibuy_price: { nullable: true, type: "float64" },
          multibuy_quantity: { nullable: true, type: "float64" },
          original_price: { nullable: true, type: "float64" },
          sale_price: { nullable: true, type: "float64" },
          store_id: { type: "float64" },
          store_name: { type: "string" },
          vendor_code: { type: "string" },
          club_multibuy_limit: { nullable: true, type: "float64" },
          club_multibuy_price: { nullable: true, type: "float64" },
          club_multibuy_quantity: { nullable: true, type: "float64" },
          club_price: { nullable: true, type: "float64" },
        },
      },
    },
    size: { type: "string" },
    unit: { type: "string" },
  },
};

/**
 * The key used to index the GrocerProduct schema with ajv
 */
export const key = "src/grocer/api/GrocerProduct";

/**
 * The key used to index the GrocerProduct[] schema with ajv
 */
export const arrayKey = key + "[]";

/**
 * Calls {@link ajv.getSchema} with the GrocerProduct schema {@link key}. The schema is
 * compiled on the first call to  {@link ajv.getSchema}.
 *
 * @returns A validate() function for GrocerProduct
 */
export const getGrocerProductSchema = () => getRequiredSchema<GrocerProduct>(key);

/**
 * Calls {@link ajv.getSchema} with the GrocerProducts schema {@link arrayKey}. The schema is
 * compiled on the first call to  {@link ajv.getSchema}.
 *
 * @returns A validate() function for an array of GrocerProducts
 */
export const getGrocerProductsSchema = () => getRequiredSchema<GrocerProduct[]>(arrayKey);

// Register schemas with ajv
ajv.addSchema(schema, key);
ajv.addSchema({ elements: schema }, arrayKey);

/**
 * Development tool - regenerates this code based on samples.json, replacing the
 * contents of this folder. Use when the schema changes.
 */
export async function regenerateGrocerProductSchema() {
  return generateTypes(
    {
      typeName: "GrocerProduct",
      sourceDir: "src/grocer/api",
      generateArrayType: true,
    },
    ...samples
  );
}
