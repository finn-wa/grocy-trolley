import { testSchemaWithSamples } from "@gt/jtd/test-utils";
import samples from "./samples.json";
import { getShoppingListItemSchema } from "./schema";

describe("ShoppingListItems Schema", () => {
  const validate = getShoppingListItemSchema();
  testSchemaWithSamples(validate, samples);
});
