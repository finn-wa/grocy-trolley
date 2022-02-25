import { EnvParser } from "@grocy-trolley/env";
import { PAKNSAVE_URL } from ".";
import { FoodstuffsAuthService } from "./foodstuffs-auth";

xdescribe("FoodstuffsAuthService", () => {
  let service: FoodstuffsAuthService;
  let envParser: EnvParser;

  beforeAll(() => {
    envParser = new EnvParser("env.json");
  });

  beforeEach(() => {
    const env = envParser.env;
    service = new FoodstuffsAuthService(PAKNSAVE_URL, env.PAKNSAVE_EMAIL, env.PAKNSAVE_PASSWORD);
  });

  it("should log in", async () => {
    const res = await service.login();
    expect(res).withContext("Response").toBeTruthy();
    expect(service.loggedIn).withContext("Logged in").toBeTrue();
    expect(service.cookie).withContext("Cookie").toBeTruthy();
    expect(service.userProfile).withContext("User profile").toBeTruthy();
  });
});
