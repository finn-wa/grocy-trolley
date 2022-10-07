import { testSchemaWithSamples } from "@gt/jtd/test-utils";
import samples from "./samples.json";
import { getShoppingLocationsSchema } from "./schema";
import { beforeEach, beforeAll, afterAll, describe, expect, test } from "vitest";
describe("[internal] ShoppingLocations Schema", () => {
  const validate = getShoppingLocationsSchema();
  testSchemaWithSamples(validate, samples);
});
