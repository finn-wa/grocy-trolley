import { ajv, getRequiredSchema } from "@gt/jtd/ajv";
import { generateTypes } from "@gt/jtd/generate-types";
import { JTDSchemaType } from "ajv/dist/jtd";
import { GrocerBarcodeProduct } from ".";
import samples from "./samples.json";

/**
 * This will cause a TypeScript compiler error if the GrocerBarcodeProduct type defined in
 * index.ts is modified in a way that makes it incompatible with the schema.
 */
export const schema: JTDSchemaType<GrocerBarcodeProduct> = {
  properties: {
    barcode: { type: "string" },
    brand: { type: "string" },
    id: { type: "float64" },
    name: { type: "string" },
    size: { type: "string" },
    unit: { type: "string" },
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
  },
};

/**
 * The key used to index the GrocerBarcodeProduct schema with ajv
 */
export const key = "src/grocer/api/GrocerBarcodeProduct";

/**
 * Calls {@link ajv.getSchema} with the GrocerBarcodeProduct schema {@link key}. The schema is
 * compiled on the first call to  {@link ajv.getSchema}.
 *
 * @returns A validate() function for GrocerBarcodeProduct
 */
export const getGrocerBarcodeProductSchema = () => getRequiredSchema<GrocerBarcodeProduct>(key);

// Register schema with ajv
ajv.addSchema(schema, key);

/**
 * Development tool - regenerates this code based on samples.json, replacing the
 * contents of this folder. Use when the schema changes.
 */
export async function regenerateGrocerBarcodeProductSchema() {
  return generateTypes(
    {
      typeName: "GrocerBarcodeProduct",
      sourceDir: "src/grocer/api",
      generateArrayType: false,
    },
    ...samples
  );
}
