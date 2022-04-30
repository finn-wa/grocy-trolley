import { access } from "fs/promises";
import path from "path";
import { Browser, BrowserContext, JSHandle, Page } from "playwright";
import { APPLICATION_JSON, headersBuilder, raw } from "@gt/utils/headers";
import { Logger, prettyPrint } from "@gt/utils/logger";
import { PAKNSAVE_URL } from "../foodstuffs.model";

/**
 * Uses Playwright to perform Foodstuffs requests from a browser. Necessary
 * because Cloudflare now blocks requests that are not sent from a browser.
 */
export class FoodstuffsUserAgent {
  protected readonly logger = new Logger(this.constructor.name);
  private context?: BrowserContext;
  private page?: Page;

  /**
   * Creates a new FoodstuffsUserAgent.
   * @param browser Playwright Browser instance to use to perform requests
   * @param loginDetails Optional Foodstuffs login details. If provided, Playwright
   *    logs into this account and sends requests with credentials.
   * @param storageStateDir Path to directory used for saved storage state (only
   *    used when loginDetails are provided).
   */
  constructor(
    private readonly browser: Browser,
    private readonly loginDetails?: LoginDetails | null,
    private readonly storageStateDir = "src/resources/cache/playwright"
  ) {}

  /**
   * Creates a new agent with the same browser but new login details
   * @param loginDetails Login details for the new agent, or null to omit them
   * @returns the new agent
   */
  clone(loginDetails: LoginDetails | null): FoodstuffsUserAgent {
    return new FoodstuffsUserAgent(this.browser, loginDetails ?? undefined, this.storageStateDir);
  }

  /**
   * Performs a fetch request as a logged in user on the PAK'n'SAVE website.
   * @param method Request method
   * @param url Request URL
   * @param headers Request headers
   * @param body Request body
   * @returns Request response
   */
  async fetchWithBrowser(
    method: string,
    url: string,
    headers?: Headers,
    body?: any
  ): Promise<Response> {
    const page = await this.getPage();
    return this.fetchWithPage(page, method, url, headers, body);
  }

  /**
   * Performs a fetch request from the browser using Playwright.
   * Necessary because Cloudflare now blocks requests that are not sent from a browser.
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
  ): Promise<Response> {
    this.logger.debug(`${method} ${url}`);
    if (headers) {
      this.logger.trace("Headers: " + prettyPrint(Array.from(headers.entries())));
    }
    if (body) {
      this.logger.trace("Body: " + prettyPrint(body));
    }
    const contentType = headers?.get("content-type");
    if (contentType === APPLICATION_JSON && body) {
      body = JSON.stringify(body);
    }
    const rawHeaders = headers ? raw(headers) : undefined;
    const responseHandle = await page.evaluateHandle(
      async ({ url, method, rawHeaders, body }) =>
        fetch(url, {
          credentials: this.loginDetails ? "include" : undefined,
          referrer: "https://www.paknsave.co.nz/shop",
          mode: "cors",
          method,
          // Record<string, string[]> is not in HeadersInit but it works in firefox at least
          headers: rawHeaders as unknown as HeadersInit | undefined,
          body,
        }),
      { url, method, rawHeaders, body }
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
    await page.goto(`${PAKNSAVE_URL}/shop`);
    // If loginDetails exist, log in
    if (this.loginDetails) {
      // Test if already logged in
      try {
        await this.fetchWithPage(
          page,
          "GET",
          `${PAKNSAVE_URL}/CommonApi/Account/GetUserProfile`,
          headersBuilder().acceptJson().build()
        );
      } catch (error) {
        await page.click('button[id="login-form"]');
        await page.fill('input[id="login-email"]', this.loginDetails.email);
        await page.fill('input[id="login-password"]', this.loginDetails.password);
        await page.click("button.login-form-submit");
        // page refreshes after submission
        await page.waitForLoadState("networkidle");
        await page.waitForRequest(`${PAKNSAVE_URL}/CommonApi/Cart/Index`);
        // search box seems to pop in last
        await page.locator('input[aria-label="Search products"]').waitFor();
        // save logged in state
        await page.context().storageState({ path: this.getStorageStateFilePath() });
      }
    }
    this.page = page;
    return this.page;
  }

  private getStorageStateFilePath(): string {
    if (!this.loginDetails) {
      throw new Error("No storage state is saved when loginDetails is undefined");
    }
    return path.join(this.storageStateDir, this.loginDetails.email.replace(/\W+/g, "_") + ".json");
  }

  /**
   * Returns the browser context with cached storage state (if found).
   * Creates a new browser context if needed.
   * @returns Browser context
   */
  private async getContext(): Promise<BrowserContext> {
    if (this.context) {
      return this.context;
    }
    if (this.loginDetails) {
      const storageStatePath = this.getStorageStateFilePath();
      try {
        await access(storageStatePath);
        // No error means that cached storageState exists
        this.context = await this.browser.newContext({ storageState: storageStatePath });
        return this.context;
      } catch (error) {
        this.logger.info("No storageState found, creating new context");
      }
    }
    this.context = await this.browser.newContext();
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

  async json(): Promise<any> {
    const body = await this.text();
    try {
      return JSON.parse(body);
    } catch (error) {
      throw new Error("Failed to parse response body as JSON: \n" + body);
    }
  }

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
