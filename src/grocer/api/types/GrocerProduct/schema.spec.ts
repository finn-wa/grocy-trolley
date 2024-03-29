import { testSchemaWithSamples } from "@gt/jtd/test-utils";
import { describe } from "vitest";
import samples from "./samples.json";
import { getGrocerProductSchema } from "./schema";

describe("[internal] GrocerProduct Schema", () => {
  const validate = getGrocerProductSchema();
  testSchemaWithSamples(validate, samples);
});
