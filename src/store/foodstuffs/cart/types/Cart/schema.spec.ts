import { testSchemaWithSamples } from "@gt/jtd/test-utils";
import { describe } from "vitest";
import { FoodstuffsCart } from "../../foodstuffs-cart.model";
import samples from "./samples.json";
import { getCartSchema } from "./schema";

describe("[internal] FoodstuffsCart Schema", () => {
  const validate = getCartSchema();
  testSchemaWithSamples(validate, samples as FoodstuffsCart[]);
});
