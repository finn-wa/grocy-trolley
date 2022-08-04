import { LoginDetails } from "@gt/store/shared/rest/login-details.model";
import { getEnvAs, initEnv } from "@gt/utils/environment";
import { Logger } from "@gt/utils/logger";
import { jest } from "@jest/globals";
import { existsSync } from "fs";
import { readdir, rm } from "fs/promises";
import path from "path";
import * as cacheUtils from "../../../utils/cache";
import { getBrowser } from "../../shared/rest/browser";
import { FoodstuffsAuthHeaderProvider } from "./foodstuffs-auth-header-provider";
import { FoodstuffsRestService } from "./foodstuffs-rest-service";

class TestRestService extends FoodstuffsRestService {
  protected readonly logger = new Logger(this.constructor.name);
  authHeaders = () => super.authHeaders();
}

describe("FoodstuffsRestService", () => {
  let authHeaderProvider: FoodstuffsAuthHeaderProvider;
  let service: TestRestService;

  initEnv({
    envFilePath: ".test.env",
    envFilePathOptional: true,
    requiredVars: ["PAKNSAVE_EMAIL", "PAKNSAVE_PASSWORD"],
  });
  const loginDetails: LoginDetails = getEnvAs({
    PAKNSAVE_EMAIL: "email",
    PAKNSAVE_PASSWORD: "password",
  });
  // Different cache dir for these tests to avoid clearing cache for other tests
  const cacheEmailOverride = loginDetails.email + "_rest-service-test";
  (cacheUtils as any).sanitiseEmailForCache = jest.fn((_email: string) => cacheEmailOverride);
  const cacheDir = path.join(cacheUtils.getCacheDir(), "foodstuffs", cacheEmailOverride);

  beforeEach(async () => {
    await rm(cacheDir, { recursive: true, force: true });
    authHeaderProvider = new FoodstuffsAuthHeaderProvider(getBrowser, loginDetails);
    service = new TestRestService(authHeaderProvider);
  });

  afterAll(async () => {
    const browser = await getBrowser();
    await browser.close();
  });

  test("authHeaders", async () => {
    expect(existsSync(cacheDir)).toBeFalsy();
    const builder = await service.authHeaders();
    const rawHeaders = builder.raw();
    expect(rawHeaders.cookie).toHaveLength(1);
    expect(rawHeaders.cookie[0]).toMatch(/UserCookieV1/);

    const newService = new TestRestService(authHeaderProvider);
    // should load from cache without using browser
    const cachedHeaders = (await newService.authHeaders()).raw();
    expect(cachedHeaders).toEqual(rawHeaders);
    // These assertions are more to test whether the separate cache path is working
    const cacheFiles = await readdir(cacheDir);
    expect(cacheFiles).toMatchObject<ArrayLike<unknown>>({ length: 2 });
  });
});
