import { getEnvAs, initEnv } from "@gt/utils/environment";
import { toRaw } from "@gt/utils/headers";
import { Logger } from "@gt/utils/logger";
import { firefox, FirefoxBrowser } from "playwright";
import { FoodstuffsCart } from "../cart/foodstuffs-cart";
import {
  FoodstuffsUserAgent,
  FoodstuffsUserProfile,
  LoginDetails,
} from "../user-agent/foodstuffs-user-agent";
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

function cachePath() {
  return "src/resources/cache/playwright-test/" + new Date().toISOString().replaceAll(":", "_");
}

describe("FoodstuffsRestService", () => {
  let browser: FirefoxBrowser;
  let service: TestRestService;

  initEnv({ envFilePath: ".test.env" });
  const loginDetails: LoginDetails = getEnvAs({
    PAKNSAVE_EMAIL: "email",
    PAKNSAVE_PASSWORD: "password",
  });

  beforeAll(async () => {
    browser = await firefox.launch({ headless: true });
  });

  beforeEach(() => {
    const userAgent = new FoodstuffsUserAgent(browser, loginDetails, cachePath());
    service = new TestRestService(userAgent);
  });

  afterAll(async () => {
    await browser.close();
  });

  test("authHeaders", async () => {
    const builder = await service.authHeaders();
    const rawHeaders = toRaw(builder.headers);
    expect(rawHeaders.cookie).toHaveLength(1);
    expect(rawHeaders.cookie[0]).toMatch(/UserCookieV1/);
  });

  test("get cart", async () => {
    const cart = await service.getCart();
    expect(cart).toBeTruthy();
    expect(cart).toHaveProperty("products");
    expect(Array.isArray(cart.products)).toBeTruthy();
  });
});
