import { testSchemaWithSamples } from "@gt/jtd/test-utils";
import samples from "./samples.json";
import { getGrocerProductSchema } from "./schema";

describe("GrocerProduct Schema", () => {
  const validate = getGrocerProductSchema();
  testSchemaWithSamples(validate, samples);
});