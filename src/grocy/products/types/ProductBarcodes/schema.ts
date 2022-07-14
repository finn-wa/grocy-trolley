import { ajv, getRequiredSchema } from "@gt/jtd/ajv";
import { JTDSchemaType } from "ajv/dist/jtd";
import { ProductBarcodes } from ".";

/**
 * This will cause a TypeScript compiler error if the ProductBarcodes type defined in
 * index.ts is modified in a way that makes it incompatible with the schema.
 */
export const schema: JTDSchemaType<ProductBarcodes> = {
  elements: {
    properties: {
      amount: { type: "string" },
      barcode: { type: "string" },
      id: { type: "string" },
      last_price: { type: "string", nullable: true },
      note: { type: "string" },
      product_id: { type: "string" },
      qu_id: { type: "string" },
      row_created_timestamp: { type: "string" },
      shopping_location_id: { type: "string" },
    },
  },
};

/**
 * The key used to index the ProductBarcodes schema with ajv
 */
export const key = "src/grocy/products/ProductBarcodes";

/**
 * Calls {@link ajv.getSchema} with the ProductBarcodes schema {@link key}. The schema is
 * compiled on the first call to  {@link ajv.getSchema}.
 *
 * @returns A validate() function for ProductBarcodes
 */
export const getProductBarcodesSchema = () => getRequiredSchema<ProductBarcodes>(key);

// Register schema with ajv instance
ajv.addSchema(schema, key);
