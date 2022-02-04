import { PakNSaveAuthService } from "./paknsave-auth";

describe("PakNSaveAuthService", () => {
  let service: PakNSaveAuthService;

  beforeEach(() => {
    service = new PakNSaveAuthService("finnwa24@gmail.com", "");
  });

  it("should log in", async () => {
    const res = await service.login();
    expect(res).withContext("Response").toBeTruthy();
    expect(service.loggedIn).withContext("Logged in").toBeTrue();
    expect(service.cookie).withContext("Cookie").toBeTruthy();
    expect(service.userProfile).withContext("User profile").toBeTruthy();
  });
});
