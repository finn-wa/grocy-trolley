import { registerAppDependencies } from "@gt/app";
import { getEnvAs, initEnv } from "@gt/utils/environment";
import { container } from "tsyringe";
import { closeBrowser } from "../shared/rest/browser";
import { CountdownTokens } from "./countdown-di";

/**
 * Initialises the environment variables for Countdown tests.
 * Should only be called once per test suite.
 */
export function beforeAllCountdownTests(envFilePath = ".test.env") {
  initEnv({
    envFilePath,
    envFilePathOptional: true,
    requiredVars: ["COUNTDOWN_EMAIL", "COUNTDOWN_PASSWORD"],
  });
}

/**P
 * Initialises the dependency injection container for Countdown tests.
 * @returns dependency container for chaining
 */
export function countdownTestContainer() {
  registerAppDependencies(container);
  const loginDetails = getEnvAs({ COUNTDOWN_EMAIL: "email", COUNTDOWN_PASSWORD: "password" });
  return container.register(CountdownTokens.loginDetails, { useValue: loginDetails });
}

export async function afterAllCountdownTests() {
  return closeBrowser();
}
