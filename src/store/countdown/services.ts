import { getEnvAs } from "@gt/utils/environment";
import { getBrowser } from "../shared/rest/browser";
import { CountdownOrderService } from "./orders/countdown-order-service";
import { CountdownUserAgent } from "./rest/countdown-user-agent";
import { CountdownTrolleyService } from "./trolley/countdown-trolley-service";

export async function countdownServices(): Promise<CountdownServices> {
  const loginDetails = getEnvAs({ COUNTDOWN_EMAIL: "email", COUNTDOWN_PASSWORD: "password" });
  const userAgent = new CountdownUserAgent(getBrowser, loginDetails);
  return {
    userAgent,
    trolleyService: new CountdownTrolleyService(userAgent),
    orderService: new CountdownOrderService(userAgent),
  };
}

export interface CountdownServices {
  userAgent: CountdownUserAgent;
  trolleyService: CountdownTrolleyService;
  orderService: CountdownOrderService;
}
