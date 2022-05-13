import { getBrowser } from "@gt/store/shared/rest/browser";
import { LoginDetails } from "@gt/store/shared/rest/login-details.model";
import { getEnvAs, initEnv } from "@gt/utils/environment";
import { Logger } from "@gt/utils/logger";
import { jest } from "@jest/globals";
import { existsSync } from "fs";
import { readdir, rm } from "fs/promises";
import * as cacheUtils from "../../../utils/cache";
import { CountdownRestService } from "./countdown-rest-service";
import { CountdownUserAgent } from "./countdown-user-agent";

class TestRestService extends CountdownRestService {
  protected readonly logger = new Logger(this.constructor.name);
  authHeaders = () => super.authHeaders();

  async getTrolley(): Promise<any> {
    const builder = await this.authHeaders();
    return this.getAndParse(this.buildUrl("/v1/trolleys/my"), {
      headers: builder.acceptJson().build(),
    });
  }
}

describe("CountdownRestService", () => {
  let userAgent: CountdownUserAgent;
  let service: TestRestService;

  initEnv({
    envFilePath: ".test.env",
    envFilePathOptional: true,
    requiredVars: ["COUNTDOWN_EMAIL", "COUNTDOWN_PASSWORD"],
  });
  const loginDetails: LoginDetails = getEnvAs({
    COUNTDOWN_EMAIL: "email",
    COUNTDOWN_PASSWORD: "password",
  });
  // Different cache dir for these tests to avoid clearing cache for other tests
  const cacheDir = cacheUtils.getCacheDirForEmail(loginDetails.email) + "_rest-service-test";
  (cacheUtils as any).getCacheDirForEmail = jest.fn((_email: string) => cacheDir);

  beforeEach(async () => {
    await rm(cacheDir, { recursive: true, force: true });
    userAgent = new CountdownUserAgent(getBrowser, loginDetails);
    service = new TestRestService(userAgent);
  });

  afterAll(async () => {
    const browser = await getBrowser();
    await browser.close();
  });

  test("authHeaders", async () => {
    expect(existsSync(cacheDir)).toBeFalsy();
    const getHeadersSpy = jest.spyOn(userAgent, "getHeaders");
    const builder = await service.authHeaders();
    expect(getHeadersSpy).toHaveBeenCalledTimes(1);

    const rawHeaders = builder.raw();
    const newService = new TestRestService(userAgent);
    // should load from cache without using browser
    const cachedHeaders = (await newService.authHeaders()).raw();
    expect(cachedHeaders).toEqual(rawHeaders);
    expect(getHeadersSpy).toHaveBeenCalledTimes(1);
    // These assertions are more to test whether the separate cache path is working
    const cacheFiles = await readdir(`${cacheDir}/${userAgent.storeName}`);
    expect(cacheFiles).toMatchObject<ArrayLike<unknown>>({ length: 2 });
  });

  test("getTrolley", async () => {
    const trolley = await service.getTrolley();
    expect(trolley).toBeTruthy();
    expect(trolley.isSuccessful).toBe(true);
    expect(trolley).toMatchSnapshot();
  });
});
