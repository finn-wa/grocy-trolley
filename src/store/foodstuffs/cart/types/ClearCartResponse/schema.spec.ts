import { testSchemaWithSamples } from "@gt/jtd/test-utils";
import samples from "./samples.json";
import { getClearCartResponseSchema } from "./schema";

describe("[internal] ClearCartResponse Schema", () => {
  const validate = getClearCartResponseSchema();
  testSchemaWithSamples(validate, samples);
});
