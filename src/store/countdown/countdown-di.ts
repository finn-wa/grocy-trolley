import { getEnvAs } from "@gt/utils/environment";
import { DependencyContainer } from "tsyringe";

export const CountdownTokens = {
  loginDetails: "CountdownLoginDetails",
} as const;

export function registerCountdownDependencies(container: DependencyContainer) {
  const loginDetails = getEnvAs({ COUNTDOWN_EMAIL: "email", COUNTDOWN_PASSWORD: "password" });
  return container.register(CountdownTokens.loginDetails, { useValue: loginDetails });
}
