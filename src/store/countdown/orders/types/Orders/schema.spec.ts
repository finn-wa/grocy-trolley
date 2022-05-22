import { testSchemaWithSamples } from "@gt/jtd/test-utils";
import samples from "./samples.json";
import { getOrdersSchema } from "./schema";

describe('Orders Schema', () => {
  const validate = getOrdersSchema();
  testSchemaWithSamples(validate, samples);
});