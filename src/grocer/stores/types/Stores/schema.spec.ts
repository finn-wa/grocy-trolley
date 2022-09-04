import { testSchemaWithSamples } from "@gt/jtd/test-utils";
import samples from "./samples.json";
import { getStoresSchema } from "./schema";

describe("[internal] Stores Schema", () => {
  const validate = getStoresSchema();
  testSchemaWithSamples(validate, samples);
});
