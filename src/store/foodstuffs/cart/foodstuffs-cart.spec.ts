import { getEnvAs, initEnv } from "@gt/utils/environment";
import { LoginDetails } from "../user-agent/foodstuffs-user-agent";

class TestData {}

describe("FoodstuffsCartService", () => {
  initEnv({ envFilePath: ".test.env" });
  const loginDetails: LoginDetails = getEnvAs({
    PAKNSAVE_EMAIL: "email",
    PAKNSAVE_PASSWORD: "password",
  });

  test("l", () => {});
});
