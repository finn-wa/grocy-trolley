import { LoginDetails } from "@gt/store/shared/rest/login-details.model";
import { StoreUserAgent } from "@gt/store/shared/rest/store-user-agent";
import { Logger } from "@gt/utils/logger";
import { Browser, BrowserContext, Page } from "playwright";
import { AppTokens, FoodstuffsTokens } from "../../../injection-tokens";
import { PAKNSAVE_URL } from "../models";

/**
 * Uses Playwright to perform Foodstuffs requests from a browser. Necessary
 * because Cloudflare now blocks requests that are not sent from a browser.
 */
export class FoodstuffsUserAgent extends StoreUserAgent {
  public readonly storeName = "foodstuffs";
  protected readonly logger = new Logger(this.constructor.name);

  constructor(browser: () => Promise<Browser>, loginDetails?: LoginDetails | null) {
    super(browser, loginDetails);
  }
  static readonly inject = [AppTokens.browser, FoodstuffsTokens.loginDetails] as const;

  /**
   * Creates a new agent with the same browser but new login details. If login details
   * are not provided, the user agent will be unauthenticated.
   * @param loginDetails Optional login details for the new agent
   * @returns the new agent
   */
  clone(loginDetails?: LoginDetails): FoodstuffsUserAgent {
    return new FoodstuffsUserAgent(this.browserLoader, loginDetails);
  }

  async init(context: BrowserContext): Promise<{ page: Page; headers: Headers }> {
    const page = await context.newPage();
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
    const headers = await this.getHeadersFromRequest(cartRequest);
    return { page, headers };
  }

  private async isLoggedIn(page: Page) {
    type DataLayer = { loginState?: "loggedIn" | "guest" }[];
    const loginState = await page.evaluate(() => {
      const dataLayer = (globalThis as unknown as { dataLayer: DataLayer }).dataLayer;
      return dataLayer.find((entry) => "loginState" in entry)?.loginState;
    });
    return loginState === "loggedIn";
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
