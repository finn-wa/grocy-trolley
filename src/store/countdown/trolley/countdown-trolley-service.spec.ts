import { jtdInfer } from "@gt/jtd/infer";
import { getBrowser } from "@gt/store/shared/rest/browser";
import { LoginDetails } from "@gt/store/shared/rest/login-details.model";
import { getEnvAs, initEnv } from "@gt/utils/environment";
import { CountdownUserAgent } from "../rest/countdown-user-agent";
import { CountdownTrolleyService } from "./countdown-trolley-service";

describe("CountdownTrolleyService", () => {
  let userAgent: CountdownUserAgent;
  let service: CountdownTrolleyService;

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
    service = new CountdownTrolleyService(userAgent);
  });

  test("getTrolley", async () => {
    const trolley = await service.getTrolley();
    expect(trolley).toBeTruthy();
    expect(trolley.isSuccessful).toBe(true);
  });
});
