import { testSchemaWithSamples } from "@gt/jtd/test-utils";
import samples from "./samples.json";
import { getCartSchema } from "./schema";

describe('Cart Schema', () => {
  const validate = getCartSchema();
  testSchemaWithSamples(validate, samples);
});