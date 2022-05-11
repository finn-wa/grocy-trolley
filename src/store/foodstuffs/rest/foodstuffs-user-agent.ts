import { LoginDetails } from "@gt/store/shared/rest/login-details.model";
import { StoreUserAgent } from "@gt/store/shared/rest/store-user-agent";
import { Logger } from "@gt/utils/logger";
import { BrowserContext, JSHandle, Page } from "playwright-firefox";
import { PAKNSAVE_URL } from "../models";

/**
 * Uses Playwright to perform Foodstuffs requests from a browser. Necessary
 * because Cloudflare now blocks requests that are not sent from a browser.
 */
export class FoodstuffsUserAgent extends StoreUserAgent {
  public readonly storeName = "foodstuffs";
  protected readonly logger = new Logger(this.constructor.name);

  /**
   * Creates a new agent with the same browser but new login details
   * @param loginDetails Login details for the new agent, or null to omit them
   * @returns the new agent
   */
  clone(loginDetails: LoginDetails | null): FoodstuffsUserAgent {
    return new FoodstuffsUserAgent(this.browserLoader, loginDetails ?? undefined);
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

/**
 * Response backed by a Playwright JSHandle browser fetch Response. json()
 * and text() extraction methods are available.
 * @deprecated could probably use waitForRequest
 */
class FoodstuffsResponse implements Response {
  readonly bodyUsed: boolean;
  readonly headers: Headers;
  readonly ok: boolean;
  readonly redirected: boolean;
  readonly status: number;
  readonly statusText: string;
  readonly type: ResponseType;
  readonly url: string;

  constructor(
    private readonly responseHandle: JSHandle<Response>,
    responseJson: SerialisedResponse
  ) {
    this.bodyUsed = responseJson.bodyUsed;
    this.ok = responseJson.ok;
    this.redirected = responseJson.redirected;
    this.status = responseJson.status;
    this.statusText = responseJson.statusText;
    this.type = responseJson.type;
    this.url = responseJson.url;
    this.headers = new Headers(responseJson.headers);
  }

  /* eslint-disable */
  async json(): Promise<any> {
    const body = await this.text();
    try {
      return JSON.parse(body);
    } catch (error) {
      throw new Error("Failed to parse response body as JSON: \n" + body);
    }
  }
  /* eslint-enable */

  async text(): Promise<string> {
    return this.responseHandle.evaluate((response) => response.text());
  }

  get body(): ReadableStream<Uint8Array> | null {
    throw new Error("Cannot access body of FoodstuffsResponse directly");
  }
  get size(): number {
    throw new Error("Cannot access size of FoodstuffsResponse directly");
  }
  buffer(): Promise<Buffer> {
    throw new Error("Method not implemented.");
  }
  clone(): Response {
    throw new Error("Method not implemented.");
  }
  arrayBuffer(): Promise<ArrayBuffer> {
    throw new Error("Method not implemented.");
  }
  blob(): Promise<Blob> {
    throw new Error("Method not implemented.");
  }
  formData(): Promise<FormData> {
    throw new Error("Method not implemented.");
  }
}

const UNSERIALISABLE_RESPONSE_PROPS = [
  "arrayBuffer",
  "blob",
  "formData",
  "json",
  "text",
  "clone",
  "body",
] as const;
type UnserialisableResponseProp = typeof UNSERIALISABLE_RESPONSE_PROPS[number];

const SERIALISABLE_RESPONSE_PROPS = [
  "headers",
  "ok",
  "redirected",
  "status",
  "statusText",
  "type",
  "url",
] as const;

interface SerialisedResponse extends Omit<Response, UnserialisableResponseProp | "headers"> {
  headers: Record<string, string>;
}
