import { PAKNSAVE_URL } from ".";
import { FoodstuffsAuthService } from "./foodstuffs-auth";

xdescribe("FoodstuffsAuthService", () => {
  let service: FoodstuffsAuthService;

  beforeEach(() => {
    service = new FoodstuffsAuthService(PAKNSAVE_URL);
  });

  it("should log in", async () => {
    const res = await service.login();
    expect(res).withContext("Response").toBeTruthy();
    expect(service.loggedIn).withContext("Logged in").toBeTrue();
    expect(service.cookie).withContext("Cookie").toBeTruthy();
    expect(service.userProfile).withContext("User profile").toBeTruthy();
  });
});
