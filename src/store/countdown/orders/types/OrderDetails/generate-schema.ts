import { generateTypes } from "@gt/jtd/generate-types";
import samples from "./samples.json";

/**
 * Development tool - regenerates schema code based on samples.json, replacing the
 * contents of this folder. Use when the schema changes.
 */
export async function regenerateOrderDetailsSchema() {
  return generateTypes(
    {
      typeName: "OrderDetails",
      sourceDir: "src/store/countdown/orders",
      generateArrayType: true,
    },
    ...samples
  );
}
