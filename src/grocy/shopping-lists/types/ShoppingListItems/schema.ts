import { withNumbers } from "@gt/grocy/types/grocy-types";
import { ajv, getRequiredSchema } from "@gt/jtd/ajv";
import { JTDSchemaType } from "ajv/dist/jtd";
import { RawShoppingListItem, RawShoppingListItems, ShoppingListItem } from ".";

/**
 * This will cause a TypeScript compiler error if the ShoppingListItems type defined in
 * index.ts is modified in a way that makes it incompatible with the schema.
 */
export const schema: JTDSchemaType<RawShoppingListItems> = {
  elements: {
    properties: {
      amount: { type: "float64" } as never, // JTD doesn't support "string | number" union types
      done: { type: "string" },
      id: { type: "string" },
      note: { type: "string", nullable: true },
      product_id: { type: "string" },
      qu_id: { type: "string" },
      row_created_timestamp: { type: "string" },
      shopping_list_id: { type: "string" },
    },
  },
};

/**
 * The key used to index the ShoppingListItems schema with ajv
 */
export const key = "src/grocy/shopping-lists/ShoppingListItems";

/**
 * Calls {@link ajv.getSchema} with the ShoppingListItems schema {@link key}. The schema is
 * compiled on the first call to  {@link ajv.getSchema}.
 *
 * @returns A validate() function for ShoppingListItems
 */
export const getShoppingListItemsSchema = () => getRequiredSchema<RawShoppingListItems>(key);

// Register schema with ajv instance
ajv.addSchema(schema, key);

export function parseShoppingListItem(raw: RawShoppingListItem): ShoppingListItem {
  return withNumbers(raw, ["amount"]);
}
