import { testSchemaWithSamples } from "@gt/jtd/test-utils";
import { FoodstuffsCart } from "../../foodstuffs-cart.model";
import samples from "./samples.json";
import { getCartSchema } from "./schema";

describe("Cart Schema", () => {
  const validate = getCartSchema();
  testSchemaWithSamples(validate, samples as FoodstuffsCart[]);
});
