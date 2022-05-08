import { getCacheDir } from "@gt/utils/cache";
import { getEnvAs, initEnv } from "@gt/utils/environment";
import { Logger } from "@gt/utils/logger";
import { rm } from "fs/promises";
import { firefox, FirefoxBrowser } from "playwright";
import { FoodstuffsCart } from "../cart/foodstuffs-cart.model";
import { FoodstuffsUserAgent, FoodstuffsUserProfile, LoginDetails } from "./foodstuffs-user-agent";
import { FoodstuffsRestService } from "./foodstuffs-rest-service";

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
  let browser: FirefoxBrowser;
  let userAgent: FoodstuffsUserAgent;
  let service: TestRestService;

  initEnv({ envFilePath: ".test.env" });
  const loginDetails: LoginDetails = getEnvAs({
    PAKNSAVE_EMAIL: "email",
    PAKNSAVE_PASSWORD: "password",
  });

  beforeAll(async () => {
    browser = await firefox.launch({ headless: true });
  });

  beforeEach(async () => {
    await rm(getCacheDir(), { recursive: true, force: true });
    userAgent = new FoodstuffsUserAgent(browser, loginDetails);
    service = new TestRestService(userAgent);
  });

  afterAll(async () => {
    await browser.close();
  });

  test("authHeaders", async () => {
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
  });

  test("get cart", async () => {
    const cart = await service.getCart();
    expect(cart).toBeTruthy();
    expect(cart).toHaveProperty("products");
    expect(Array.isArray(cart.products)).toBeTruthy();
  });
});
