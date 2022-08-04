import { testSchemaWithSamples } from "@gt/jtd/test-utils";
import samples from "./samples.json";
import { getOrderDetailsSchema } from "./schema";

describe("OrderDetails Schema", () => {
  const validate = getOrderDetailsSchema();
  testSchemaWithSamples(validate, samples);
});