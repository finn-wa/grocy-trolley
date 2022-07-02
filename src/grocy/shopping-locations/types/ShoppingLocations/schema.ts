import { ajv, getRequiredSchema } from "@gt/jtd/ajv";
import { JTDSchemaType } from "ajv/dist/jtd";
import { ShoppingLocations } from ".";

/**
 * This will cause a TypeScript compiler error if the ShoppingLocations type defined in
 * index.ts is modified in a way that makes it incompatible with the schema.
 */
export const schema: JTDSchemaType<ShoppingLocations> = {
  elements: {
    properties: {
      description: { type: "string" },
      id: { type: "string" },
      name: { type: "string" },
      row_created_timestamp: { type: "string" },
      userfields: { properties: { brand: { type: "string" }, storeId: { type: "string" } } },
    },
  },
};

/**
 * The key used to index the ShoppingLocations schema with ajv
 */
export const key = "src/grocy/shopping-locations/ShoppingLocations";

/**
 * Calls {@link ajv.getSchema} with the ShoppingLocations schema {@link key}. The schema is
 * compiled on the first call to  {@link ajv.getSchema}.
 *
 * @returns A validate() function for ShoppingLocations
 */
export const getShoppingLocationsSchema = () => getRequiredSchema<ShoppingLocations>(key);

// Register schema with ajv instance
ajv.addSchema(schema, key);
