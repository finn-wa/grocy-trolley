/* eslint-disable */

import { generateTypes } from "./jtd/generate-types";
import { countdownServices } from "./store/countdown/services";

export async function dev() {
  const { userAgent, orderService, trolleyService } = await countdownServices();
  // const orders = await orderService.getOrders();
  // await generateTypes("getOrders", "Orders", "src/store/countdown/orders", orders);
  // const order = await cdTrolley.getOrder(24875327);
  // await generateTypes("getOrder", "Order", "src/store/countdown/orders", order);
  const orderDetails = await orderService.getOrderDetails(24875327);
  await generateTypes(
    "getOrderDetails",
    "OrderDetails",
    "src/store/countdown/order-details",
    orderDetails
  );
  // const trolley = await cdTrolley.getTrolley();
  // await generateTypes("getTrolley", "Trolley", "src/store/countdown/trolley", trolley);
}

/* eslint-enable */
