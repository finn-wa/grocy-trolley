import { registerAppDependencies } from "@gt/app";
import { initEnv } from "@gt/utils/environment";
import { container } from "tsyringe";
import { closeBrowser } from "../../shared/rest/browser";
import { registerFoodstuffsDependencies } from "../foodstuffs-di";

/**
 * Initialises the environment variables for Foodstuffs tests.
 * Should only be called once per test suite.
 */
export function beforeAllFoodstuffsTests(envFilePath = ".test.env") {
  initEnv({
    envFilePath,
    envFilePathOptional: true,
    requiredVars: ["PAKNSAVE_EMAIL", "PAKNSAVE_PASSWORD"],
  });
}

/**P
 * Initialises the dependency injection container for Foodstuffs tests.
 * @returns dependency container for chaining
 */
export function foodstuffsTestContainer() {
  registerAppDependencies(container);
  registerFoodstuffsDependencies(container);
  return container;
}

export async function afterAllFoodstuffsTests() {
  return closeBrowser();
}
