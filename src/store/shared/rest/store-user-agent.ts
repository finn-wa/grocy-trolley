import { LoginDetails } from "@gt/store/shared/rest/login-details.model";
import { getCacheDirForEmail } from "@gt/utils/cache";
import { Logger } from "@gt/utils/logger";
import { existsSync } from "fs";
import path from "path";
import { Browser, BrowserContext, Page, Request as PlaywrightRequest } from "playwright";

export abstract class StoreUserAgent {
  public abstract readonly storeName: string;
  protected readonly logger = new Logger(this.constructor.name);
  private context?: BrowserContext;
  private page?: Page;
  private headers?: Headers;

  /**
   * Creates a new FoodstuffsUserAgent.
   * @param browserLoader Cold promise that returns the Playwright Browser
   *    instance to use to perform requests.
   * @param loginDetails Optional login details. If provided, Playwright logs
   *    into this account and sends requests with credentials.
   */
  constructor(
    protected readonly browserLoader: () => Promise<Browser>,
    protected readonly loginDetails?: LoginDetails | null
  ) {}

  /**
   * Initialises the page state and return headers for future requests.
   * {@link getHeadersFromRequest} may be helpful.
   * @param context Browser context to create page
   */
  abstract init(context: BrowserContext): Promise<{ page: Page; headers: Headers }>;

  get email(): string | undefined {
    return this.loginDetails?.email;
  }

  async getHeaders(): Promise<Headers> {
    if (this.headers) {
      return this.headers;
    }
    await this.getLoginPage();
    if (this.headers) {
      return this.headers;
    }
    throw new Error("Failed to init headers with getLoginPage");
  }

  /**
   * Returns the login page. Creates a new page and logs in if needed.
   * @returns Login page
   */
  protected async getLoginPage(): Promise<Page> {
    if (this.page) {
      return this.page;
    }
    const context = await this.getContext();
    const { page, headers } = await this.init(context);
    if (this.loginDetails) {
      // save logged in state
      await page.context().storageState({ path: this.getStorageStateFilePath() });
    }
    this.page = page;
    this.headers = headers;
    return this.page;
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
    const browser = await this.browserLoader();
    if (this.loginDetails) {
      const storageStatePath = this.getStorageStateFilePath();
      if (existsSync(storageStatePath)) {
        this.context = await browser.newContext({ storageState: storageStatePath });
        return this.context;
      }
      this.logger.info("No storageState found, creating new context");
    }
    this.context = await browser.newContext();
    return this.context;
  }

  protected async getHeadersFromRequest(request: PlaywrightRequest) {
    const headers = new Headers();
    const headersArray = await request.headersArray();
    headersArray.forEach(({ name, value }) => headers.append(name, value));
    return headers;
  }

  private getStorageStateFilePath(): string {
    if (!this.loginDetails) {
      throw new Error("No storage state is saved when loginDetails is undefined");
    }
    return path.join(
      getCacheDirForEmail(this.loginDetails.email),
      this.storeName,
      "playwright.json"
    );
  }
}
