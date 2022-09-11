import samples from "./samples.json";
import { generateTypes } from "@gt/jtd/generate-types";

/**
 * Development tool - regenerates schema code based on samples.json, replacing the
 * contents of this folder. Use when the schema changes.
 */
export async function regenerateGrocerProductSchema() {
  return generateTypes(
    {
      typeName: "GrocerProduct",
      sourceDir: "src/grocer/api",
      generateArrayType: true,
    },
    ...samples
  );
}
