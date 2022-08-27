import { AppTokens } from "@gt/app/di";
import { AuthHeaderProvider } from "@gt/store/shared/rest/auth-header-provider";
import { LoginDetails } from "@gt/store/shared/rest/login-details.model";
import { HeadersBuilder } from "@gt/utils/headers";
import { Logger, prettyPrint } from "@gt/utils/logger";
import { getHeadersFromRequest } from "@gt/utils/playwright";
import { RestService } from "@gt/utils/rest";
import { Browser, Page } from "playwright";
import { inject, Lifecycle, scoped } from "tsyringe";
import { FoodstuffsTokens } from "../foodstuffs-di";
import { PAKNSAVE_URL } from "../models";

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
    @inject(AppTokens.browserLoader) browserLoader: () => Promise<Browser>,
    @inject(FoodstuffsTokens.loginDetails) loginDetails?: LoginDetails
  ) {
    super("foodstuffs", browserLoader, loginDetails);
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
    class FoodstuffsAuthHeaderTestService extends RestService {
      protected readonly baseUrl = `${PAKNSAVE_URL}/CommonApi`;
      protected readonly logger = new Logger(this.constructor.name);
      getCart(authHeaders: Headers) {
        return this.getAndParse(this.buildUrl("/Cart/Index"), {
          headers: new HeadersBuilder(authHeaders).acceptJson().build(),
        });
      }
    }
    const testService = new FoodstuffsAuthHeaderTestService();
    try {
      const cart = await testService.getCart(headers);
      if (!cart || typeof cart !== "object" || Object.keys(cart).length === 0) {
        // We expect getCart to throw an error if it failed, but if it returns ok check the body
        throw new Error("Test getCart request failed: " + prettyPrint(cart));
      }
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
