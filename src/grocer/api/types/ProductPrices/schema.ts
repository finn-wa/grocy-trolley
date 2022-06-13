import { ajv, getRequiredSchema } from "@gt/jtd/ajv";
import { JTDSchemaType } from "ajv/dist/jtd";
import { ProductPrices } from ".";

/**
 * This will cause a TypeScript compiler error if the ProductPrices type defined in
 * index.ts is modified in a way that makes it incompatible with the schema.
 */
export const schema: JTDSchemaType<ProductPrices> = {
  elements: {
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
  },
};

/**
 * The key used to index the ProductPrices schema with ajv
 */
export const key = "src/grocer/api/ProductPrices";

/**
 * Calls {@link ajv.getSchema} with the ProductPrices schema {@link key}. The schema is
 * compiled on the first call to  {@link ajv.getSchema}.
 *
 * @returns A validate() function for ProductPrices
 */
export const getProductPricesSchema = () => getRequiredSchema<ProductPrices>(key);

// Register schema with ajv instance
ajv.addSchema(schema, key);
