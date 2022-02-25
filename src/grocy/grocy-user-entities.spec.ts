import { GrocyUserEntityService } from ".";

xdescribe("GrocyUserEntityService", () => {
  let service: GrocyUserEntityService;

  beforeEach(() => {
    service = new GrocyUserEntityService();
  });

  it("should get user entities", async () => {
    const entities = await service.getUserEntities();
    expect(entities).toBeTruthy();
    expect(entities.length).toBeGreaterThan(0);
  });
});
