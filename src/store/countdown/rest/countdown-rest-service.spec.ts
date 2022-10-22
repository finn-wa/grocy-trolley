import { AppTokens, defaultDependencies, registerDependencies } from "@gt/app/di";
import { getBrowser } from "@gt/store/shared/rest/browser";
import { LoginDetails } from "@gt/store/shared/rest/login-details.model";
import { getEnvAs, getEnvVar, initEnv } from "@gt/utils/environment";
import { Logger } from "@gt/utils/logger";
import { existsSync } from "fs";
import { readdir, rm } from "fs/promises";
import path from "path";
import { container } from "tsyringe";
import { afterAll, beforeEach, describe, expect, test } from "vitest";
import * as cacheUtils from "../../../utils/cache";
import { registerCountdownDependencies } from "../countdown-di";
import { CountdownAuthHeaderProvider } from "./countdown-auth-header-provider";
import { CountdownRestService } from "./countdown-rest-service";

class TestRestService extends CountdownRestService {
  protected readonly logger = new Logger(this.constructor.name);
  // Make authHeaders public for tests
  authHeaders = () => super.authHeaders();
}

describe("[external] CountdownRestService", () => {
  let authHeaderProvider: CountdownAuthHeaderProvider;
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
  const relativeCacheDir =
    cacheUtils.sanitiseEmailForCache(loginDetails.email) + "_cd-rest-service-test";
  const cacheDir = path.join(getEnvVar("CACHE_DIR"), relativeCacheDir);
  const testContainer = container.createChildContainer();

  // Different cache dir for these tests to avoid clearing cache for other tests
  registerDependencies(testContainer, {
    ...defaultDependencies,
    [AppTokens.browserLoader]: { useValue: () => getBrowser({ headless: false }) },
    [AppTokens.childContainer]: { useFactory: () => testContainer.createChildContainer() },
    [AppTokens.cacheServiceFactory]: {
      useValue: (_: string) => cacheUtils.createCacheService(relativeCacheDir),
    },
  });
  registerCountdownDependencies(testContainer);

  beforeEach(async () => {
    await rm(cacheDir, { recursive: true, force: true });
    authHeaderProvider = testContainer.resolve(CountdownAuthHeaderProvider);
    service = new TestRestService(authHeaderProvider);
  });

  afterAll(async () => {
    const browser = await getBrowser();
    await browser.close();
  });

  test(
    "authHeaders",
    async () => {
      expect(existsSync(cacheDir)).toBeFalsy();
      const builder = await service.authHeaders();
      const rawHeaders = builder.raw();
      const newService = new TestRestService(authHeaderProvider);
      // should load from cache without using browser
      const cachedHeaders = (await newService.authHeaders()).raw();
      expect(cachedHeaders).toEqual(rawHeaders);
      // These assertions are more to test whether the separate cache path is working
      const cacheFiles = await readdir(cacheDir);
      expect(cacheFiles).toEqual(["headers.json"]);
    },
    { timeout: 30_000 }
  );
});
