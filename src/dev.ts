/* eslint-disable */

import { generateTypes } from "./jtd/generate-types";
import { FoodstuffsCartController } from "./store/foodstuffs/cart/foodstuffs-cart-controller";
import { foodstuffsServices } from "./store/foodstuffs/services";

export async function dev() {
  const { userAgent } = await foodstuffsServices();

  const ctrl = new FoodstuffsCartController(userAgent);
  const cart = await ctrl.clearCart();
  await generateTypes("ClearCartResponse", "src/store/foodstuffs/cart", cart);
}

/* eslint-enable */
