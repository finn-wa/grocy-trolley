import { testSchemaWithSamples } from "@gt/jtd/test-utils";
import samples from "./samples.json";
import { getProductPricesSchema } from "./schema";

describe("ProductPrices Schema", () => {
  const validate = getProductPricesSchema();
  testSchemaWithSamples(validate, samples);
});