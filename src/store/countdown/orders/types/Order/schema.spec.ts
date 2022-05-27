import { testSchemaWithSamples } from "@gt/jtd/test-utils";
import samples from "./samples.json";
import { getOrderSchema } from "./schema";

describe("OrderSchema", () => {
  const validate = getOrderSchema();
  testSchemaWithSamples(validate, samples);
});
