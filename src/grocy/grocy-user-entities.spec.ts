import { EnvParser } from "@grocy-trolley/env";
import { GrocyUserEntityService } from ".";

xdescribe("GrocyUserEntityService", () => {
  const envParser = new EnvParser("env.json");
  let service: GrocyUserEntityService;

  beforeEach(() => {
    const env = envParser.env;
    service = new GrocyUserEntityService({ apiKey: env.GROCY_API_KEY, baseUrl: env.GROCY_URL });
  });

  it("should get user entities", async () => {
    const entities = await service.getUserEntities();
    expect(entities).toBeTruthy();
    expect(entities.length).toBeGreaterThan(0);
  });
});
