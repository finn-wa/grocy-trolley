import { withNumbers } from "@gt/grocy/types/grocy-types";
import { ajv, getRequiredSchema } from "@gt/jtd/ajv";
import { JTDSchemaType } from "ajv/dist/jtd";
import { RawShoppingListItem, ShoppingListItem } from ".";

/**
 * This will cause a TypeScript compiler error if the RawShoppingListItem type defined in
 * index.ts is modified in a way that makes it incompatible with the schema.
 */
export const schema: JTDSchemaType<RawShoppingListItem> = {
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
};

/**
 * The key used to index the ShoppingListItem schema with ajv
 */
export const key = "src/grocy/shopping-lists/ShoppingListItem";
export const arrayKey = "src/grocy/shopping-lists/ShoppingListItem[]";
/**
 * Calls {@link ajv.getSchema} with the ShoppingListItems schema {@link key}. The schema is
 * compiled on the first call to  {@link ajv.getSchema}.
 *
 * @returns A validate() function for ShoppingListItems
 */
export const getShoppingListItemSchema = () => getRequiredSchema<RawShoppingListItem>(key);

/**
 * Calls {@link ajv.getSchema} with the RawShoppingListItem schema {@link arrayKey}. The schema is
 * compiled on the first call to  {@link ajv.getSchema}.
 *
 * @returns A validate() function for an array of RawShoppingListItems
 */
export const getShoppingListItemsSchema = () => getRequiredSchema<RawShoppingListItem[]>(arrayKey);

// Register schema with ajv instance
ajv.addSchema(schema, key);
ajv.addSchema({ elements: schema }, arrayKey);

export function parseShoppingListItem(raw: RawShoppingListItem): ShoppingListItem {
  return withNumbers(raw, ["amount"]);
}
