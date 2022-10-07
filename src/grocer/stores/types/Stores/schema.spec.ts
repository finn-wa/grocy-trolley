import { testSchemaWithSamples } from "@gt/jtd/test-utils";
import { describe } from "vitest";
import samples from "./samples.json";
import { getStoresSchema } from "./schema";

describe("[internal] Stores Schema", () => {
  const validate = getStoresSchema();
  testSchemaWithSamples(validate, samples);
});
