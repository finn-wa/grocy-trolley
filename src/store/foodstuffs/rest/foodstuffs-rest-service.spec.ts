import { getEnvAs, initEnv } from "@gt/utils/environment";
import { Logger } from "@gt/utils/logger";
import { jest } from "@jest/globals";
import { existsSync } from "fs";
import { readdir, rm } from "fs/promises";
import * as cacheUtils from "../../../utils/cache";
import { FoodstuffsCart } from "../cart/foodstuffs-cart.model";
import { getBrowser } from "../services";
import { FoodstuffsRestService } from "./foodstuffs-rest-service";
import { FoodstuffsUserAgent, FoodstuffsUserProfile, LoginDetails } from "./foodstuffs-user-agent";

class TestRestService extends FoodstuffsRestService {
  protected readonly logger = new Logger(this.constructor.name);
  authHeaders = () => super.authHeaders();

  // Doesn't seem to work
  async getUserProfile(): Promise<FoodstuffsUserProfile> {
    const builder = await this.authHeaders();
    return this.getForJson(this.buildUrl("/Account/GetUserProfile"), builder.acceptJson().build());
  }

  async getCart(): Promise<FoodstuffsCart> {
    const builder = await this.authHeaders();
    return this.getForJson(this.buildUrl("Cart/Index"), builder.acceptJson().build());
  }
}

describe("FoodstuffsRestService", () => {
  let userAgent: FoodstuffsUserAgent;
  let service: TestRestService;

  initEnv({ envFilePath: ".test.env", envFilePathOptional: true, allowUndefined: true });
  const loginDetails: LoginDetails = getEnvAs({
    PAKNSAVE_EMAIL: "email",
    PAKNSAVE_PASSWORD: "password",
  });
  // Different cache dir for these tests to avoid clearing cache for other tests
  const cacheDir = cacheUtils.getCacheDirForEmail(loginDetails.email) + "_rest-service-test";
  (cacheUtils as any).getCacheDirForEmail = jest.fn((_email: string) => cacheDir);

  beforeEach(async () => {
    await rm(cacheDir, { recursive: true, force: true });
    userAgent = new FoodstuffsUserAgent(getBrowser, loginDetails);
    service = new TestRestService(userAgent);
  });

  afterAll(async () => {
    const browser = await getBrowser();
    await browser.close();
  });

  test("cache files are created", async () => {
    await service.authHeaders();
  });

  test("authHeaders", async () => {
    expect(existsSync(cacheDir)).toBeFalsy();
    const getHeadersSpy = jest.spyOn(userAgent, "getHeaders");
    const builder = await service.authHeaders();
    expect(getHeadersSpy).toHaveBeenCalledTimes(1);

    const rawHeaders = builder.raw();
    expect(rawHeaders.cookie).toHaveLength(1);
    expect(rawHeaders.cookie[0]).toMatch(/UserCookieV1/);

    const newService = new TestRestService(userAgent);
    // should load from cache without using browser
    const cachedHeaders = (await newService.authHeaders()).raw();
    expect(cachedHeaders).toEqual(rawHeaders);
    expect(getHeadersSpy).toHaveBeenCalledTimes(1);
    // These assertions are more to test whether the separate cache path is working
    const cacheFiles = await readdir(cacheDir);
    expect(cacheFiles.length).toBeGreaterThan(1);
  });
});
