import { testSchemaWithSamples } from "@gt/jtd/test-utils";
import samples from "./samples.json";
import { getShoppingLocationsSchema } from "./schema";

describe("ShoppingLocations Schema", () => {
  const validate = getShoppingLocationsSchema();
  testSchemaWithSamples(validate, samples);
});