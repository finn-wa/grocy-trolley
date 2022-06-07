import { ajv, getRequiredSchema } from "@gt/jtd/ajv";
import { JTDSchemaType } from "ajv/dist/jtd";
import { Stores } from ".";

/**
 * This will cause a TypeScript compiler error if the Stores type defined in
 * index.ts is modified in a way that makes it incompatible with the schema.
 */
export const schema: JTDSchemaType<Stores> = {
  elements: {
    properties: {
      id: { type: "float64" },
      name: { type: "string" },
      vendor_code: { enum: ["cd", "nw", "pns", "tw"] },
    },
  },
};

/**
 * The key used to index the Stores schema with ajv
 */
export const key = "src/grocer/api/Stores";

/**
 * Calls {@link ajv.getSchema} with the Stores schema {@link key}. The schema is
 * compiled on the first call to  {@link ajv.getSchema}.
 *
 * @returns A validate() function for Stores
 */
export const getStoresSchema = () => getRequiredSchema<Stores>(key);

// Register schema with ajv instance
ajv.addSchema(schema, key);
