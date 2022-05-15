import { describeSchema } from "@gt/jtd/test-utils";
import { getBrowser } from "@gt/store/shared/rest/browser";
import { LoginDetails } from "@gt/store/shared/rest/login-details.model";
import { getEnvAs, initEnv } from "@gt/utils/environment";
import { CountdownUserAgent } from "../rest/countdown-user-agent";
import { CountdownOrderService } from "./countdown-order-service";

describe("CountdownOrderService", () => {
  let userAgent: CountdownUserAgent;
  let service: CountdownOrderService;

  initEnv({
    envFilePath: ".test.env",
    envFilePathOptional: true,
    requiredVars: ["COUNTDOWN_EMAIL", "COUNTDOWN_PASSWORD"],
  });
  const loginDetails: LoginDetails = getEnvAs({
    COUNTDOWN_EMAIL: "email",
    COUNTDOWN_PASSWORD: "password",
  });

  beforeEach(async () => {
    userAgent = new CountdownUserAgent(getBrowser, loginDetails);
    service = new CountdownOrderService(userAgent);
  });

  test("getOrders", async () => {
    const orders = await service.getOrders();
    expect(orders).toBeTruthy();
    // expect(orders.isSuccessful).toBe(true);
  });
});
