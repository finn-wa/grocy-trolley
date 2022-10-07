import { testSchemaWithSamples } from "@gt/jtd/test-utils";
import { describe } from "vitest";
import samples from "./samples.json";
import { getOrderDetailsSchema } from "./schema";

describe("[internal] OrderDetails Schema", () => {
  const validate = getOrderDetailsSchema();
  testSchemaWithSamples(validate, samples);
});
