import { getBrowser } from "@gt/store/shared/rest/browser";
import { LoginDetails } from "@gt/store/shared/rest/login-details.model";
import { getEnvAs, initEnv } from "@gt/utils/environment";
import { Logger } from "@gt/utils/logger";
import { jest } from "@jest/globals";
import { existsSync } from "fs";
import { readdir, rm } from "fs/promises";
import * as cacheUtils from "../../../utils/cache";
import { CountdownRestService } from "./countdown-rest-service";
import { CountdownAuthHeaderProvider } from "./countdown-auth-header-provider";

class TestRestService extends CountdownRestService {
  protected readonly logger = new Logger(this.constructor.name);
  // Make authHeaders public for tests
  authHeaders = () => super.authHeaders();
}

describe("CountdownRestService", () => {
  let userAgent: CountdownAuthHeaderProvider;
  let service: TestRestService;

  initEnv({
    envFilePath: ".test.env",
    envFilePathOptional: true,
    requiredVars: ["COUNTDOWN_EMAIL", "COUNTDOWN_PASSWORD"],
  });
  const loginDetails: LoginDetails = getEnvAs({
    COUNTDOWN_EMAIL: "email",
    COUNTDOWN_PASSWORD: "password",
  });
  // Different cache dir for these tests to avoid clearing cache for other tests
  const cacheDir = cacheUtils.getCacheDirForEmail(loginDetails.email) + "_rest-service-test";
  (cacheUtils as any).getCacheDirForEmail = jest.fn((_email: string) => cacheDir);

  beforeEach(async () => {
    await rm(cacheDir, { recursive: true, force: true });
    userAgent = new CountdownAuthHeaderProvider(getBrowser, loginDetails);
    service = new TestRestService(userAgent);
  });

  afterAll(async () => {
    const browser = await getBrowser();
    await browser.close();
  });

  test("authHeaders", async () => {
    expect(existsSync(cacheDir)).toBeFalsy();
    const builder = await service.authHeaders();
    const rawHeaders = builder.raw();
    const newService = new TestRestService(userAgent);
    // should load from cache without using browser
    const cachedHeaders = (await newService.authHeaders()).raw();
    expect(cachedHeaders).toEqual(rawHeaders);
    // These assertions are more to test whether the separate cache path is working
    const cacheFiles = await readdir(`${cacheDir}/${userAgent.name}`);
    expect(cacheFiles).toMatchObject<ArrayLike<unknown>>({ length: 2 });
  });
});
