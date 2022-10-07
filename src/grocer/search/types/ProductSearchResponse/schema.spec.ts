import { testSchemaWithSamples } from "@gt/jtd/test-utils";
import { describe } from "vitest";
import { ProductSearchResponse } from ".";
import samples from "./samples.json";
import { getProductSearchResponseSchema } from "./schema";

describe("[internal] ProductSearchResponse Schema", () => {
  const validate = getProductSearchResponseSchema();
  testSchemaWithSamples(validate, samples as ProductSearchResponse[]);
});
