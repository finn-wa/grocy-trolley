/* eslint-disable */

import { generateTypes } from "./jtd/generate-types";
import { countdownServices } from "./store/countdown/services";

export async function dev() {
  const { userAgent, orderService, trolleyService } = await countdownServices();
  // const orders = await orderService.getOrders();
  // await generateTypes("Orders", "src/store/countdown/orders", orders);

  // const order = await cdTrolley.getOrder(24875327);
  // await generateTypes("Order", "src/store/countdown/orders", order);

  // const orders = await orderService.getOrders();
  // await generateTypes("Orders", "src/store/countdown/orders", orders);

  const trolley = await trolleyService.getTrolley();
  await generateTypes("Trolley", "src/store/countdown/trolley", trolley);
}

/* eslint-enable */
