import { registerDefaultDependencies } from "@gt/app/di";
import { initEnv } from "@gt/utils/environment";
import { container } from "tsyringe";
import { closeBrowser } from "../../shared/rest/browser";
import { registerCountdownDependencies } from "../countdown-di";

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
  registerDefaultDependencies(container);
  registerCountdownDependencies(container);
  return container;
}

export async function afterAllCountdownTests() {
  return closeBrowser();
}
