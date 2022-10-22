import { AppTokens } from "@gt/app/di";
import { LoginDetails } from "@gt/store/shared/rest/login-details.model";
import {
  CacheService,
  CacheServiceFactory,
  getCacheDir,
  sanitiseEmailForCache,
} from "@gt/utils/cache";
import { HeadersBuilder, headersFromRaw, headersToRaw } from "@gt/utils/headers";
import { Logger } from "@gt/utils/logger";
import { existsSync } from "fs";
import path from "path";
import { Browser, BrowserContext, Page } from "playwright";
import { inject } from "tsyringe";

/**
 * Provides authenticated headers for API requests to an online store. Logs in
 * to the store using Playwright and caches the headers.
 */
export abstract class AuthHeaderProvider {
  /**
   * Defines the headers to use for future requests and the headers to discard.
   */
  protected abstract readonly headersFilter: { allowed: string[]; disallowed: string[] };
  protected abstract readonly logger: Logger;

  private readonly headersCache: CacheService<{ headers: Record<string, string[]> }>;
  private browserState: BrowserState | null = null;
  /** Authenticated headers to use for API requests */
  private _authHeaders: Headers | null = null;

  /**
   * Creates a new AuthHeaderService.
   * @param name Name of store/website. Used for cache path.
   * @param browserLoader Cold promise that returns the Playwright Browser
   *    instance to use to perform requests.
   * @param loginDetails Optional login details. If provided, Playwright logs
   *    into this account and sends requests with credentials.
   */
  constructor(
    @inject(AppTokens.cacheServiceFactory)
    getCacheService: CacheServiceFactory<{ headers: Record<string, string[]> }>,
    public readonly name: string,
    protected readonly browserLoader: () => Promise<Browser>,
    protected readonly loginDetails?: LoginDetails | null
  ) {
    // use provider
    this.headersCache = getCacheService(
      path.join(name, sanitiseEmailForCache(loginDetails?.email))
    );
  }

  /**
   * Initialises the page to a logged-in state and return headers for future
   * authenticated requests. getHeadersFromRequest (in playwright utils) may be
   * helpful. Do not worry about filtering the headers, that will be done
   * automatically (remember to define {@link headersFilter}).
   * @param page fresh browser page to use to log in to website. Will be kept
   *              open for future requests if needed, so do not clean up.
   * @return captured authenticated headers
   */
  protected abstract login(page: Page): Promise<Headers>;

  /**
   * Used to test whether cached headers are valid or not.
   * @param headers Headers to test
   * @returns True if the headers are valid
   */
  protected abstract isValid(headers: Headers): Promise<boolean>;

  /**
   *
   * @returns Headers with auth information
   */
  async authHeaders(): Promise<HeadersBuilder> {
    if (!this._authHeaders) {
      this._authHeaders = await this.retrieveAuthHeaders();
    }
    return new HeadersBuilder(this._authHeaders);
  }

  private async retrieveAuthHeaders(): Promise<Headers> {
    this.logger.debug("Retrieving auth headers...");
    console.log(this.headersCache);

    const rawCachedHeaders = await this.headersCache.get("headers");
    if (rawCachedHeaders) {
      const cachedHeaders = headersFromRaw(rawCachedHeaders);
      if (await this.isValid(cachedHeaders)) {
        this.logger.debug("Using cached auth headers");
        this._authHeaders = cachedHeaders;
        return cachedHeaders;
      }
    }
    this.logger.info("No valid cached headers found, logging in...");
    this.browserState = await this.newBrowserState();
    const capturedHeaders = await this.login(this.browserState.page);
    const authHeaders = await this.filterCapturedHeaders(capturedHeaders);
    // Cache browser state post-login
    await this.browserState.context.storageState({ path: this.getPlaywrightStoragePath() });
    // Cache filtered headers
    await this.headersCache.set("headers", headersToRaw(authHeaders));
    this._authHeaders = authHeaders;
    return authHeaders;
  }

  /**
   * Returns a new browser context with cached storage state (if found).
   * This is a pure function that does not set fields.
   * @returns Browser context
   */
  private async newBrowserState(): Promise<BrowserState> {
    const browser = await this.browserLoader();
    const storageState = this.getPlaywrightStoragePath();
    const context = existsSync(storageState)
      ? await browser.newContext({ storageState })
      : await browser.newContext();
    return { context, page: await context.newPage() };
  }

  private getPlaywrightStoragePath(): string {
    return path.join(
      getCacheDir(),
      this.name,
      sanitiseEmailForCache(this.loginDetails?.email),
      "playwright.json"
    );
  }

  /**
   * Filters out disallowed headers from a Headers object.
   * @param capturedHeaders Headers captured from authenticated request in {@link login}
   * @returns New Headers object containing only permitted headers
   */
  private async filterCapturedHeaders(capturedHeaders: Headers): Promise<Headers> {
    const allowed = this.headersFilter.allowed.map((name) => name.toLowerCase());
    const disallowed = this.headersFilter.disallowed.map((name) => name.toLowerCase());
    const authHeaders = new Headers();
    for (const name of capturedHeaders.keys()) {
      const lowercaseName = name.toLowerCase();
      if (disallowed.includes(lowercaseName)) {
        continue;
      }
      if (!allowed.includes(lowercaseName)) {
        this.logger.warn(`Unrecognised header:\n${name}: ${capturedHeaders.get(name)}`);
      }
      authHeaders.set(name, capturedHeaders.get(name)!);
    }
    return authHeaders;
  }
}

interface BrowserState {
  context: BrowserContext;
  page: Page;
}
