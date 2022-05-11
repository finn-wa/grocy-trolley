import { StoreUserAgent } from "@gt/store/shared/rest/store-user-agent";
import { Logger } from "@gt/utils/logger";
import { BrowserContext, Page, Request as PlaywrightRequest } from "playwright-firefox";
import { COUNTDOWN_URL, Shell } from "../models";

export class CountdownUserAgent extends StoreUserAgent {
  public readonly storeName = "countdown";
  protected readonly logger = new Logger(this.constructor.name);

  async init(context: BrowserContext): Promise<{ page: Page; headers: Headers }> {
    const page = await context.newPage();
    const [_, shellRequest] = await Promise.all([
      page.goto(COUNTDOWN_URL + "/shop/securelogin"),
      page.waitForRequest(`${COUNTDOWN_URL}/api/v1/shell`),
    ]);
    if (!this.loginDetails || (await this.isLoggedIn(shellRequest))) {
      return { page, headers: await this.getHeadersFromRequest(shellRequest) };
    }
    await page.waitForLoadState("networkidle");
    await page.type("input#loginID", this.loginDetails.email);
    await page.type("input#password", this.loginDetails.password);
    await page.click('button[value="Submit"]');
    // Arbitrary authenticated request that happens after login
    const request = await page.waitForRequest(`${COUNTDOWN_URL}/api/v1/shoppers/my/recipes`);
    return { page, headers: await this.getHeadersFromRequest(request) };
  }

  private async isLoggedIn(shellRequest: PlaywrightRequest): Promise<boolean> {
    const body = (await shellRequest.response().then((res) => res?.json())) as Shell;
    return body?.context?.shopper?.isLoggedIn;
  }
}
