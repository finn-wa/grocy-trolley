import { getEnvAs } from "utils/env";
import { LoginDetails } from "../foodstuffs-user-agent";

class TestData {
  readonly loginDetails: LoginDetails = getEnvAs({
    PAKNSAVE_EMAIL: "email",
    PAKNSAVE_PASSWORD: "password",
  });
}

describe("FoodstuffsCartService", () => {
  let loginDetails: LoginDetails;
  test("example", () => {
    expect(1 + 1).toEqual(2);
  });
});
