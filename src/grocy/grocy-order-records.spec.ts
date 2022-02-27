import { GrocyOrderRecordService, GrocyUserEntityService, OrderRecord } from ".";

xdescribe("GrocyOrderRecordService", () => {
  let service: GrocyOrderRecordService;

  beforeEach(() => {
    const userEntityService = new GrocyUserEntityService();
    service = new GrocyOrderRecordService(userEntityService);
  });

  it("should get order records", async () => {
    const records = await service.getOrderRecords();
    expect(records).toBeTruthy();
  });

  it("should add an order", async () => {
    const order: OrderRecord = {
      date: "2022-02-02",
      brand: "PNS",
      imported: "0",
      orderId: "bongus",
    };
    const res = await service.createOrderRecord(order);
    expect(res.objectId).toBeGreaterThanOrEqual(0);
    expect(res.response).toBeTruthy();
    expect(res.response.ok).toBeTrue();
  });
});
