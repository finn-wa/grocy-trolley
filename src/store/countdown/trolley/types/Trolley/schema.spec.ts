import { testSchemaWithSamples } from "@gt/jtd/test-utils";
import samples from "./samples.json";
import { getTrolleySchema } from "./schema";

describe("Trolley Schema", () => {
  const validate = getTrolleySchema();
  testSchemaWithSamples(validate, samples);
});
