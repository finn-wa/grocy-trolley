import { getEnv } from "env";
import { access } from "fs/promises";
import { Headers, Response as NodeResponse } from "node-fetch";
import { Browser, BrowserContext, JSHandle, Page } from "playwright";
import { APPLICATION_JSON, headers } from "utils/headers-builder";
import { Logger, prettyPrint } from "utils/logger";
import { PAKNSAVE_URL } from "./foodstuffs.model";

export class FoodstuffsUserAgent {
  protected readonly logger = new Logger(this.constructor.name);
  private readonly loginDetails: LoginDetails;
  private context?: BrowserContext;
  private page?: Page;

  // TODO: support creating a user agent without logging in. for unauthenticated search requests
  constructor(
    private readonly browser: Browser,
    loginDetails?: LoginDetails,
    private readonly storageStatePath = "src/resources/cache/playwright.json"
  ) {
    if (loginDetails) {
      this.loginDetails = loginDetails;
    } else {
      const { PAKNSAVE_EMAIL: email, PAKNSAVE_PASSWORD: password } = getEnv();
      this.loginDetails = { email, password };
    }
  }

  /**
   * Performs a fetch request as a logged in user on the PAK'n'SAVE website.
   * @param method Request method
   * @param url Request URL
   * @param headers Request headers
   * @param body Request body
   * @returns Request response
   */
  async fetchAsUser(
    method: string,
    url: string,
    headers?: Headers,
    body?: any
  ): Promise<NodeResponse> {
    const page = await this.getPage();
    return this.fetchWithPage(page, method, url, headers, body);
  }

  /**
   * Performs a fetch request from the browser using Playwright. Necessary
   * because Cloudflare now blocks requests that are not sent from a browser.
   * WARNING: not every method on the returned Response is callable, see
   * {@link FoodstuffsRequest}.
   * @param page Playwright page instance to use to perform the request
   * @param method Request method
   * @param url Request URL
   * @param headers Request headers
   * @param body Request body
   * @returns Request response
   */
  private async fetchWithPage(
    page: Page,
    method: string,
    url: string,
    headers?: Headers,
    body?: BodyInit | any
  ): Promise<NodeResponse> {
    this.logger.debug(`${method} ${url}`);
    if (headers) {
      this.logger.trace(headers);
    }
    if (body) {
      this.logger.trace(body);
    }
    const contentType = headers?.get("content-type");
    if (contentType === APPLICATION_JSON && body) {
      body = JSON.stringify(body);
    }
    const responseHandle = await page.evaluateHandle(
      async ({ url, method, headers, body }) =>
        fetch(url, {
          credentials: "include",
          referrer: "https://www.paknsave.co.nz/shop",
          mode: "cors",
          method,
          headers,
          body,
        }),
      { url, method, headers, body }
    );
    // Response is not serialisable, so we must serialise it
    const response = await responseHandle.evaluate((response, props) => {
      const responseJson: Record<string, any> = Object.fromEntries(
        props.map((key) => [key, response[key]])
      );
      responseJson.headers = Object.fromEntries(responseJson.headers.entries());
      return responseJson as SerialisedResponse;
    }, SERIALISABLE_RESPONSE_PROPS);
    if (!response.ok) {
      throw new Error(`Response not OK: ${prettyPrint(response)}`);
    }
    this.logger.trace("Response: " + prettyPrint(response));
    return new FoodstuffsResponse(responseHandle, response);
  }

  /**
   * Returns the login page. Creates a new page and logs in if needed.
   * @returns Login page
   */
  private async getPage(): Promise<Page> {
    if (this.page) {
      return this.page;
    }
    const context = await this.getContext();
    const page = await context.newPage();
    await page.goto(PAKNSAVE_URL + "shop");
    // Check if already logged in
    try {
      await this.fetchWithPage(
        page,
        "GET",
        `${PAKNSAVE_URL}/CommonApi/Account/GetUserProfile`,
        headers().acceptJson().build()
      );
    } catch (error) {
      await page.click('button[id="login-form"]');
      await page.fill('input[id="login-email"]', this.loginDetails.email);
      await page.fill('input[id="login-password"]', this.loginDetails.password);
      await page.click("button.login-form-submit");
      // page refreshes after submission
      await page.waitForLoadState("networkidle");
      // search box seems to pop in last
      await page.locator('input[aria-label="Search products"]').waitFor();
      // save logged in state
      await page.context().storageState({ path: this.storageStatePath });
    }
    this.page = page;
    return this.page;
  }

  /**
   * Returns the browser context with cached storage state (if found).
   * Creates a new browser context if needed.
   * @returns Browser context
   */
  private async getContext(): Promise<BrowserContext> {
    if (!this.context) {
      try {
        await access(this.storageStatePath);
        // No error means that cached storageState exists
        this.context = await this.browser.newContext({ storageState: this.storageStatePath });
      } catch (error) {
        this.logger.info("No storageState found, creating new context");
        this.context = await this.browser.newContext();
      }
    }
    return this.context;
  }
}

export interface LoginDetails {
  email: string;
  password: string;
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
 */
class FoodstuffsResponse implements NodeResponse {
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

  json(): Promise<any> {
    return this.responseHandle.evaluate((response) => response.json());
  }

  text(): Promise<string> {
    return this.responseHandle.evaluate((response) => response.text());
  }

  get body(): NodeJS.ReadableStream | null {
    throw new Error("Cannot access body of FoodstuffsResponse directly");
  }
  get size(): number {
    throw new Error("Cannot access size of FoodstuffsResponse directly");
  }
  buffer(): Promise<Buffer> {
    throw new Error("Method not implemented.");
  }
  clone(): NodeResponse {
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

const SERIALISABLE_RESPONSE_PROPS = [
  "headers",
  "ok",
  "redirected",
  "status",
  "statusText",
  "type",
  "url",
] as const;

interface SerialisedResponse
  extends Omit<Response, typeof UNSERIALISABLE_RESPONSE_PROPS[number] | "headers"> {
  headers: Record<string, string>;
}
