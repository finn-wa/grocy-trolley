/* eslint-disable */

import { generateTypes } from "./jtd/generate-types";
import { CountdownOrderService } from "./store/countdown/orders/countdown-order-service";
import { CountdownUserAgent } from "./store/countdown/rest/countdown-user-agent";
import { CountdownTrolleyService } from "./store/countdown/trolley/countdown-trolley-service";
import { getBrowser } from "./store/shared/rest/browser";
import { getEnvAs } from "./utils/environment";

export async function dev() {
  const cdTrolley = new CountdownTrolleyService(
    new CountdownUserAgent(
      getBrowser,
      getEnvAs({ COUNTDOWN_EMAIL: "email", COUNTDOWN_PASSWORD: "password" })
    )
  );
  // const orders = await cdTrolley.getOrders();
  // await generateTypes("getOrders", "Orders", "src/store/countdown/orders", orders);
  // const order = await cdTrolley.getOrder(24875327);
  // await generateTypes("getOrder", "Order", "src/store/countdown/orders", order);
  const trolley = await cdTrolley.getTrolley();
  await generateTypes("getTrolley", "Trolley", "src/store/countdown/trolley", trolley);
}

/* eslint-enable */
