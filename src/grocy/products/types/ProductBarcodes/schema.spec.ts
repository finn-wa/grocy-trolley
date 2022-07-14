import { testSchemaWithSamples } from "@gt/jtd/test-utils";
import samples from "./samples.json";
import { getProductBarcodesSchema } from "./schema";

describe("ProductBarcodes Schema", () => {
  const validate = getProductBarcodesSchema();
  testSchemaWithSamples(validate, samples);
});