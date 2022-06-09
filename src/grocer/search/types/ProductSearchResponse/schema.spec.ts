import { testSchemaWithSamples } from "@gt/jtd/test-utils";
import { ProductSearchResponse } from ".";
import samples from "./samples.json";
import { getProductSearchResponseSchema } from "./schema";

describe("ProductSearchResponse Schema", () => {
  const validate = getProductSearchResponseSchema();
  testSchemaWithSamples(validate, samples as ProductSearchResponse[]);
});
