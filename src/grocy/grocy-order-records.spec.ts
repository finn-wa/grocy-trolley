import { Env, EnvParser } from "@grocy-trolley/env";
import {
  GrocyOrderRecordService,
  GrocyUserEntityService,
  OrderRecord,
} from ".";

xdescribe("GrocyOrderRecordService", () => {
  const envParser = new EnvParser("env.json");
  let service: GrocyOrderRecordService;

  beforeEach(() => {
    const { GROCY_API_KEY, GROCY_URL } = envParser.env;
    const userEntityService = new GrocyUserEntityService(
      GROCY_API_KEY,
      GROCY_URL
    );
    service = new GrocyOrderRecordService(
      GROCY_API_KEY,
      GROCY_URL,
      userEntityService
    );
  });

  it("should get order records", async () => {
    const records = await service.getOrderRecords();
    expect(records).toBeTruthy();
  });

  it("should add an order", async () => {
    const order: OrderRecord = {
      date: "2022-02-02",
      brand: "PAK'n'SAVE",
      imported: "0",
      orderId: "bongus",
    };
    const res = await service.createOrderRecord(order);
    expect(res.objectId).toBeGreaterThanOrEqual(0);
    expect(res.response).toBeTruthy();
    expect(res.response.ok).toBeTrue();
  });
});
