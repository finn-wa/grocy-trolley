import { generateTypes } from "@gt/jtd/generate-types";
import samples from "./samples.json";

/**
 * Development tool - regenerates schema code based on samples.json, replacing the
 * contents of this folder. Use when the schema changes.
 */
export async function regenerateGrocerBarcodeProductSchema() {
  return generateTypes(
    {
      typeName: "GrocerBarcodeProduct",
      sourceDir: "src/grocer/api",
      generateArrayType: false,
    },
    ...samples
  );
}
