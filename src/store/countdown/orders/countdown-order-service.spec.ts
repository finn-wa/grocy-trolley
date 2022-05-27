import { expectSchemaToValidate } from "@gt/jtd/test-utils";
import { getBrowser } from "@gt/store/shared/rest/browser";
import { LoginDetails } from "@gt/store/shared/rest/login-details.model";
import { getEnvAs, initEnv } from "@gt/utils/environment";
import { CountdownUserAgent } from "../rest/countdown-user-agent";
import { CountdownOrderService } from "./countdown-order-service";
import { getOrderSchema } from "./types/Order/schema";
import { getOrderDetailsSchema } from "./types/OrderDetails/schema";
import { getOrdersSchema } from "./types/Orders/schema";

describe("CountdownOrderService", () => {
  let userAgent: CountdownUserAgent;
  let service: CountdownOrderService;

  initEnv({
    envFilePath: ".env", // Use real account because it has orders in it
    envFilePathOptional: true,
    requiredVars: ["COUNTDOWN_EMAIL", "COUNTDOWN_PASSWORD"],
  });
  const loginDetails: LoginDetails = getEnvAs({
    COUNTDOWN_EMAIL: "email",
    COUNTDOWN_PASSWORD: "password",
  });
  const orderId = 24875327;

  beforeEach(async () => {
    userAgent = new CountdownUserAgent(getBrowser, loginDetails);
    service = new CountdownOrderService(userAgent);
  });

  test("getOrders", async () =>
    expectSchemaToValidate(getOrdersSchema(), await service.getOrders()));

  test("getOrder", async () =>
    expectSchemaToValidate(getOrderSchema(), await service.getOrder(orderId)));

  test("getOrderDetails", async () =>
    expectSchemaToValidate(getOrderDetailsSchema(), await service.getOrderDetails(orderId)));
});
