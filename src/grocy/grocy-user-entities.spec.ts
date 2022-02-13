import { EnvParser } from "@grocy-trolley/env";
import { GrocyUserEntityService } from ".";

xdescribe("GrocyUserEntityService", () => {
  const envParser = new EnvParser("env.json");
  let service: GrocyUserEntityService;

  beforeEach(() => {
    const { GROCY_API_KEY, GROCY_URL } = envParser.env;
    service = new GrocyUserEntityService(GROCY_API_KEY, GROCY_URL);
  });

  it("should get user entities", async () => {
    const entities = await service.getUserEntities();
    expect(entities).toBeTruthy();
    expect(entities.length).toBeGreaterThan(0);
  });
});
