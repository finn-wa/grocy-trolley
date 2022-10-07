import { testSchemaWithSamples } from "@gt/jtd/test-utils";
import { describe } from "vitest";
import samples from "./samples.json";
import { getTrolleySchema } from "./schema";

describe("[internal] Trolley Schema", () => {
  const validate = getTrolleySchema();
  testSchemaWithSamples(validate, samples);
});
