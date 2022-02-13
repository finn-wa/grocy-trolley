import { EnvParser } from "@grocy-trolley/env";
import { PakNSaveAuthService } from "./paknsave-auth";

xdescribe("PakNSaveAuthService", () => {
  let service: PakNSaveAuthService;
  let envParser: EnvParser;

  beforeAll(() => {
    envParser = new EnvParser("env.json");
  });

  beforeEach(() => {
    let env = envParser.env;
    service = new PakNSaveAuthService(
      env.PAKNSAVE_EMAIL,
      env.PAKNSAVE_PASSWORD
    );
  });

  it("should log in", async () => {
    const res = await service.login();
    expect(res).withContext("Response").toBeTruthy();
    expect(service.loggedIn).withContext("Logged in").toBeTrue();
    expect(service.cookie).withContext("Cookie").toBeTruthy();
    expect(service.userProfile).withContext("User profile").toBeTruthy();
  });
});
