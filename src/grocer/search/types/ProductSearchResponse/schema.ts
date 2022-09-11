import { ajv, getRequiredSchema } from "@gt/jtd/ajv";
import { JTDSchemaType } from "ajv/dist/jtd";
import { ProductSearchResponse } from ".";

/**
 * This will cause a TypeScript compiler error if the ProductSearchResponse type defined in
 * index.ts is modified in a way that makes it incompatible with the schema.
 */
export const schema: JTDSchemaType<ProductSearchResponse> = {
  properties: {
    hits: {
      elements: {
        properties: {
          brand: { type: "string", nullable: true },
          category_1: { elements: { type: "string" } },
          category_2: { elements: { type: "string" } },
          category_3: { elements: { type: "string" } },
          id: { type: "float64" },
          name: { type: "string" },
          popularity: { type: "float64" },
          size: { type: "string", nullable: true },
          stores: { elements: { type: "float64" } },
          unit: { enum: ["ea", "kg"] },
        },
      },
    },
    estimatedTotalHits: { type: "uint16" },
    query: { type: "string" },
    limit: { type: "uint16" },
    offset: { type: "uint16" },
    processingTimeMs: { type: "uint16" },
  },
};

/**
 * The key used to index the ProductSearchResponse schema with ajv
 */
export const key = "src/grocer/search/ProductSearchResponse";

/**
 * Calls {@link ajv.getSchema} with the ProductSearchResponse schema {@link key}. The schema is
 * compiled on the first call to  {@link ajv.getSchema}.
 *
 * @returns A validate() function for ProductSearchResponse
 */
export const getProductSearchResponseSchema = () => getRequiredSchema<ProductSearchResponse>(key);

// Register schema with ajv
ajv.addSchema(schema, key);
