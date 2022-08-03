import { getEnvAs } from "@gt/utils/environment";
import { DependencyContainer } from "tsyringe";

/** Foodstuffs injection tokens */
export const FoodstuffsTokens = {
  loginDetails: "FoodstuffsLoginDetails",
} as const;

export function registerFoodstuffsDependencies(_container: DependencyContainer) {
  const loginDetails = getEnvAs({
    PAKNSAVE_EMAIL: "email",
    PAKNSAVE_PASSWORD: "password",
  });
  return _container.register(FoodstuffsTokens.loginDetails, { useValue: loginDetails });
}
