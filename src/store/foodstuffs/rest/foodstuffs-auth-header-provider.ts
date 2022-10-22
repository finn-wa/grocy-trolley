import { AppTokens } from "@gt/app/di";
import { AuthHeaderProvider } from "@gt/store/shared/rest/auth-header-provider";
import { LoginDetails } from "@gt/store/shared/rest/login-details.model";
import { CacheServiceFactory } from "@gt/utils/cache";
import { HeadersBuilder } from "@gt/utils/headers";
import { Logger, prettyPrint } from "@gt/utils/logger";
import { getHeadersFromRequest } from "@gt/utils/playwright";
import { RestService } from "@gt/utils/rest";
import { Browser, Page } from "playwright";
import { inject, Lifecycle, scoped } from "tsyringe";
import { FoodstuffsTokens } from "../foodstuffs-di";
import { List } from "../lists/foodstuffs-list.model";
import { PAKNSAVE_URL } from "../models";

class FoodstuffsAuthHeaderTestService extends RestService {
  protected readonly baseUrl = `${PAKNSAVE_URL}/CommonApi`;
  protected readonly logger = new Logger(this.constructor.name);

  constructor(private readonly headers: Headers) {
    super();
  }

  getCart() {
    return this.getAndParse(this.buildUrl("/Cart/Index"), {
      headers: new HeadersBuilder(this.headers).acceptJson().build(),
    });
  }

  async createList(name: string): Promise<List> {
    return this.putAndParse(this.buildUrl("ShoppingLists/CreateList", { name }), {
      headers: new HeadersBuilder(this.headers).acceptJson().build(),
    });
  }

  async deleteList(id: string | number): Promise<Response> {
    return this.delete(this.buildUrl(`ShoppingLists/DeleteList/${id}`), {
      headers: new HeadersBuilder(this.headers).acceptJson().build(),
    });
  }
}

/**
 * Uses Playwright to perform Foodstuffs requests from a browser. Necessary
 * because Cloudflare now blocks requests that are not sent from a browser.
 */
@scoped(Lifecycle.ContainerScoped)
export class FoodstuffsAuthHeaderProvider extends AuthHeaderProvider {
  protected readonly logger = new Logger(this.constructor.name);
  protected readonly headersFilter = {
    allowed: [
      "host",
      "user-agent",
      "accept-language",
      "accept-encoding",
      "referer",
      "dnt",
      "cookie",
      "sec-fetch-dest",
      "sec-fetch-mode",
      "sec-fetch-site",
    ],
    disallowed: [
      "accept",
      "content-type",
      "x-newrelic-id",
      "newrelic",
      "traceparent",
      "tracestate",
      "__requestverificationtoken",
      "connection",
      "pragma",
      "cache-control",
      "te",
    ],
  };

  constructor(
    @inject(AppTokens.cacheServiceFactory)
    cacheServiceFactory: CacheServiceFactory<{ headers: Record<string, string[]> }>,
    @inject("BrowserLoader") browserLoader: () => Promise<Browser>,
    @inject(FoodstuffsTokens.loginDetails) loginDetails?: LoginDetails
  ) {
    super(cacheServiceFactory, "foodstuffs", browserLoader, loginDetails);
  }

  async login(page: Page): Promise<Headers> {
    await page.goto(`${PAKNSAVE_URL}/shop`);
    let cartRequest = await page.waitForRequest(`${PAKNSAVE_URL}/CommonApi/Cart/Index`);

    if (this.loginDetails && !(await this.isLoggedIn(page))) {
      this.logger.info("Logging in to foodstuffs...");
      await page.click('button[id="login-form"]');
      await page.fill('input[id="login-email"]', this.loginDetails.email);
      await page.fill('input[id="login-password"]', this.loginDetails.password);
      await page.click("button.login-form-submit");
      cartRequest = await page.waitForRequest(`${PAKNSAVE_URL}/CommonApi/Cart/Index`);
      // page refreshes after submission
      await page.waitForLoadState("networkidle");
      // search box seems to pop in last
      await page.locator('input[aria-label="Search products"]').waitFor();
    }
    return getHeadersFromRequest(cartRequest);
  }

  private async isLoggedIn(page: Page) {
    type DataLayer = { loginState?: "loggedIn" | "guest" }[];
    const loginState = await page.evaluate(() => {
      const dataLayer = (globalThis as unknown as { dataLayer: DataLayer }).dataLayer;
      return dataLayer.find((entry) => "loginState" in entry)?.loginState;
    });
    return loginState === "loggedIn";
  }

  protected async isValid(headers: Headers): Promise<boolean> {
    const testService = new FoodstuffsAuthHeaderTestService(headers);
    try {
      const cart = await testService.getCart();
      if (!cart || typeof cart !== "object" || Object.keys(cart).length === 0) {
        // We expect getCart to throw an error if it failed, but if it returns ok check the body
        throw new Error("Test getCart request failed: " + prettyPrint(cart));
      }
      const list = await testService.createList("[temp]");
      if (
        !list ||
        typeof list !== "object" ||
        Object.keys(list).length === 0 ||
        !("listId" in list)
      ) {
        throw new Error("Test createList request failed: " + prettyPrint(cart));
      }
      await testService.deleteList(list.listId);
    } catch (error) {
      this.logger.debug("Headers failed validation", headers, error);
      return false;
    }
    return true;
  }
}

export interface FoodstuffsUserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  agreedToMarketing: boolean;
  agreedToTermsAndConditions: boolean;
  clubCardUser: boolean;
}

export interface LoginResponse {
  success: boolean;
  userProfile: FoodstuffsUserProfile;
}
