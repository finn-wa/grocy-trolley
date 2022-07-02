import { testSchemaWithSamples } from "@gt/jtd/test-utils";
import samples from "./samples.json";
import { getShoppingListItemsSchema } from "./schema";

describe("ShoppingListItems Schema", () => {
  const validate = getShoppingListItemsSchema();
  testSchemaWithSamples(validate, samples);
});
