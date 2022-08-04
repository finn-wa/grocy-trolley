import { testSchemaWithSamples } from "@gt/jtd/test-utils";
import samples from "./samples.json";
import { getGrocerBarcodeProductSchema } from "./schema";

describe("GrocerBarcodeProduct Schema", () => {
  const validate = getGrocerBarcodeProductSchema();
  testSchemaWithSamples(validate, samples);
});