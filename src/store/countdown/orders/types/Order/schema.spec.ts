import { testSchemaWithSamples } from "@gt/jtd/test-utils";
import { describe } from "vitest";
import samples from "./samples.json";
import { getOrderSchema } from "./schema";

describe("[internal] Order Schema", () => {
  const validate = getOrderSchema();
  testSchemaWithSamples(validate, samples);
});
