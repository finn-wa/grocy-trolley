import { testSchemaWithSamples } from "@gt/jtd/test-utils";
import samples from "./samples.json";
import { getShoppingListSchema } from "./schema";

describe("ShoppingList Schema", () => {
  const validate = getShoppingListSchema();
  testSchemaWithSamples(validate, samples);
});
