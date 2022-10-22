import { AppTokens } from "@gt/app/di";
import { AuthHeaderProvider } from "@gt/store/shared/rest/auth-header-provider";
import { LoginDetails } from "@gt/store/shared/rest/login-details.model";
import { CacheServiceFactory } from "@gt/utils/cache";
import { Logger } from "@gt/utils/logger";
import { getHeadersFromRequest } from "@gt/utils/playwright";
import { Browser, Page, Request as PlaywrightRequest } from "playwright";
import { inject, Lifecycle, scoped } from "tsyringe";
import { CountdownTokens } from "../countdown-di";
import { COUNTDOWN_URL, Shell } from "../models";

@scoped(Lifecycle.ContainerScoped)
export class CountdownAuthHeaderProvider extends AuthHeaderProvider {
  protected readonly logger = new Logger(this.constructor.name);
  protected readonly headersFilter = {
    allowed: [
      "host",
      "user-agent",
      "accept",
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
    @inject(AppTokens.browserLoader) browserLoader: () => Promise<Browser>,
    @inject(CountdownTokens.loginDetails) loginDetails?: LoginDetails
  ) {
    super(cacheServiceFactory, "countdown", browserLoader, loginDetails);
  }

  async login(page: Page): Promise<Headers> {
    const [_, shellRequest] = await Promise.all([
      page.goto(COUNTDOWN_URL + "/shop/securelogin"),
      page.waitForRequest(`${COUNTDOWN_URL}/api/v1/shell`),
    ]);
    if (!this.loginDetails || (await this.isLoggedIn(shellRequest))) {
      return getHeadersFromRequest(shellRequest);
    }
    await page.hover("global-nav-header");
    await page.waitForLoadState("networkidle");
    await page.type("#loginContainer input#loginID", this.loginDetails.email);
    await page.type("#loginContainer input#password", this.loginDetails.password);
    await page.click("#loginContainer input#remember");
    await page.click('#loginContainer button[value="Submit"]');
    // Arbitrary authenticated request that happens after login
    const request = await page.waitForRequest(`${COUNTDOWN_URL}/api/v1/shoppers/my/recipes`);
    return getHeadersFromRequest(request);
  }

  private async isLoggedIn(shellRequest: PlaywrightRequest): Promise<boolean> {
    const body = (await shellRequest.response().then((res) => res?.json())) as Shell;
    return body?.context?.shopper?.isLoggedIn;
  }

  protected async isValid(headers: Headers): Promise<boolean> {
    this.logger.warn("CountdownAuthHeaderProvider.isValid() is hardcoded to true");
    return true;
    // TODO this is returning false negatives
    /*
    const builder = new HeadersBuilder(headers).acceptJson();
    const response = await this.get(this.buildUrl("/v1/trolleys/my"), builder.build());
    if (!response.ok) return false;
    const body = await response.json();
    return body.isSuccessful;
    */
  }
}
