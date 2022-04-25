import { firefox, FirefoxBrowser } from "playwright";
import { getEnvAs, initEnv } from "@gt/utils/environment";
import { headersBuilder } from "@gt/utils/headers";
import { PAKNSAVE_URL } from "../foodstuffs.model";
import { FoodstuffsUserAgent, LoginDetails } from "./foodstuffs-user-agent";

describe("FoodstuffsUserAgent", () => {
  initEnv({ envFilePath: ".test.env" });
  const loginDetails: LoginDetails = getEnvAs({
    PAKNSAVE_EMAIL: "email",
    PAKNSAVE_PASSWORD: "password",
  });
  const cachePath = () =>
    "src/resources/cache/playwright-test/" + new Date().toISOString().replaceAll(":", "_");

  let browser: FirefoxBrowser;
  let userAgent: FoodstuffsUserAgent;

  beforeAll(async () => {
    browser = await firefox.launch({ headless: true });
  });

  beforeEach(async () => {
    userAgent = new FoodstuffsUserAgent(browser, loginDetails, cachePath());
  });

  afterAll(async () => {
    await browser.close();
  });

  test("log in and get user profile", async () => {
    jest.setTimeout(15_000);
    const userProfile = await userAgent
      .fetchWithBrowser(
        "GET",
        `${PAKNSAVE_URL}CommonApi/Account/GetUserProfile`,
        headersBuilder().acceptJson().build()
      )
      .then((res) => res.json());
    expect(userProfile).toMatchInlineSnapshot(`
      Object {
        "agreedToMarketing": false,
        "agreedToTermsAndConditions": true,
        "clubCardUser": false,
        "email": "rncr02xpk@relay.firefox.com",
        "firstName": "Stick",
        "id": "2200932921",
        "lastName": "Man",
        "phone": "0211239876",
      }
    `);
  });
});
