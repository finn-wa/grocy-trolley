import { ajv, getRequiredSchema } from "@gt/jtd/ajv";
import { JTDSchemaType } from "ajv/dist/jtd";
import { ShoppingList } from ".";

/**
 * This will cause a TypeScript compiler error if the ShoppingList type defined in
 * index.ts is modified in a way that makes it incompatible with the schema.
 */
export const schema: JTDSchemaType<ShoppingList> = {
  properties: {
    description: { nullable: true, type: "string" },
    id: { type: "string" },
    name: { type: "string" },
    row_created_timestamp: { type: "string" },
  },
  optionalProperties: {
    userfields: { nullable: true, values: { type: "string" } },
  },
};

/**
 * The key used to index the ShoppingList schema with ajv
 */
export const key = "src/grocy/shopping-lists/ShoppingList";

/**
 * The key used to index the ShoppingList[] schema with ajv
 */
export const arrayKey = key + "[]";

/**
 * Calls {@link ajv.getSchema} with the ShoppingList schema {@link key}. The schema is
 * compiled on the first call to  {@link ajv.getSchema}.
 *
 * @returns A validate() function for ShoppingList
 */
export const getShoppingListSchema = () => getRequiredSchema<ShoppingList>(key);

/**
 * Calls {@link ajv.getSchema} with the ShoppingLists schema {@link arrayKey}. The schema is
 * compiled on the first call to  {@link ajv.getSchema}.
 *
 * @returns A validate() function for an array of ShoppingLists
 */
export const getShoppingListsSchema = () => getRequiredSchema<ShoppingList[]>(arrayKey);

// Register schema with ajv
ajv.addSchema(schema, key);
ajv.addSchema({ elements: schema }, arrayKey);
