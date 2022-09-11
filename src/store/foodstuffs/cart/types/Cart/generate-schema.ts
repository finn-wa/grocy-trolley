import { generateTypes } from "@gt/jtd/generate-types";
import samples from "./samples.json";

/**
 * Development tool - regenerates schema code based on samples.json, replacing the
 * contents of this folder. Use when the schema changes.
 */
export async function regenerateFoodstuffsCartSchema() {
  return generateTypes(
    {
      typeName: "Cart",
      sourceDir: "src/store/foodstuffs/cart/",
      generateArrayType: false,
    },
    ...samples
  );
}
