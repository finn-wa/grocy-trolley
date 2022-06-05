/* eslint-disable */

import { generateTypes } from "./jtd/generate-types";
import { TaggunReceiptScanner } from "./receipt-ocr";
import { FoodstuffsCartController } from "./store/foodstuffs/cart/foodstuffs-cart-controller";
import { foodstuffsServices } from "./store/foodstuffs/services";
import { prettyPrint } from "./utils/logger";

export async function dev() {
  const taggun = new TaggunReceiptScanner();
  const data = await taggun.fetchReceiptData("./temp/cd-30-05.jpg", "simple");
  console.log(prettyPrint(data));
}

async function _generate() {
  const { userAgent } = await foodstuffsServices();
  const ctrl = new FoodstuffsCartController(userAgent);
  const cart = await ctrl.clearCart();
  await generateTypes("ClearCartResponse", "src/store/foodstuffs/cart", cart);
}

/* eslint-enable */
