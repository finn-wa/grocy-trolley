import { AppTokens, defaultDependencies, registerDependencies } from "@gt/app/di";
import { LoginDetails } from "@gt/store/shared/rest/login-details.model";
import { createCacheService, sanitiseEmailForCache } from "@gt/utils/cache";
import { getEnvAs, getEnvVar, initEnv } from "@gt/utils/environment";
import { Logger } from "@gt/utils/logger";
import { existsSync } from "fs";
import { readdir, rm } from "fs/promises";
import path from "path";
import { container } from "tsyringe";
import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { getBrowser } from "../../shared/rest/browser";
import { registerFoodstuffsDependencies } from "../foodstuffs-di";
import { FoodstuffsAuthHeaderProvider } from "./foodstuffs-auth-header-provider";
import { FoodstuffsRestService } from "./foodstuffs-rest-service";

class TestRestService extends FoodstuffsRestService {
  protected readonly logger = new Logger(this.constructor.name);
  authHeaders = () => super.authHeaders();
}

describe("[external] FoodstuffsRestService", () => {
  let authHeaderProvider: FoodstuffsAuthHeaderProvider;
  let service: TestRestService;

  initEnv({
    envFilePath: ".test.env",
    envFilePathOptional: true,
    requiredVars: ["PAKNSAVE_EMAIL", "PAKNSAVE_PASSWORD"],
  });
  const loginDetails: LoginDetails = getEnvAs({
    PAKNSAVE_EMAIL: "email",
    PAKNSAVE_PASSWORD: "password",
  });
  const relativeCacheDir = sanitiseEmailForCache(loginDetails.email) + "_rest-service-test";
  const cacheDir = path.join(getEnvVar("CACHE_DIR"), relativeCacheDir);
  const testContainer = container.createChildContainer();

  // Different cache dir for these tests to avoid clearing cache for other tests
  registerDependencies(testContainer, {
    ...defaultDependencies,
    [AppTokens.browserLoader]: { useValue: () => getBrowser({ headless: false }) },
    [AppTokens.childContainer]: { useFactory: () => testContainer.createChildContainer() },
    [AppTokens.cacheServiceFactory]: {
      useValue: (_: string) => createCacheService(relativeCacheDir),
    },
  });
  registerFoodstuffsDependencies(testContainer);

  beforeEach(async () => {
    authHeaderProvider = testContainer.resolve(FoodstuffsAuthHeaderProvider);
    service = new TestRestService(authHeaderProvider);
    // Assumes
    await rm(cacheDir, { recursive: true, force: true });
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
      expect(rawHeaders.cookie).toHaveLength(1);
      expect(rawHeaders.cookie[0]).toMatch(/UserCookieV1/);

      const newService = new TestRestService(authHeaderProvider);
      // should load from cache without using browser
      const cachedHeaders = (await newService.authHeaders()).raw();
      expect(cachedHeaders).toEqual(rawHeaders);
      // These assertions are more to test whether the separate cache path is working
      expect(existsSync(cacheDir)).toBeTruthy();
      const cacheFiles = await readdir(cacheDir);
      expect(cacheFiles).toEqual(["headers.json"]);
    },
    { timeout: 25_000 }
  );
});
