import { expectSchemaToValidate } from "@gt/jtd/test-utils";
import {
  afterAllCountdownTests,
  beforeAllCountdownTests,
  countdownTestContainer,
} from "../test/countdown-test-utils";
import { CountdownOrderService } from "./countdown-order-service";
import { getOrderSchema } from "./types/Order/schema";
import { getOrderDetailsSchema } from "./types/OrderDetails/schema";
import { getOrdersSchema } from "./types/Orders/schema";

describe("CountdownOrderService", () => {
  let service: CountdownOrderService;

  // Use real account because it has orders in it
  beforeAll(() => beforeAllCountdownTests(".env"));

  beforeEach(() => {
    service = countdownTestContainer().resolve(CountdownOrderService);
  });

  afterAll(afterAllCountdownTests);

  async function getOrderId() {
    const orders = await service.getOrders();
    if (orders.totalItems === 0) {
      console.error("No orders found, please use a real account");
    }
    return orders.items[0].orderId;
  }

  test("getOrders", async () =>
    expectSchemaToValidate(getOrdersSchema(), await service.getOrders()));

  test("getOrder", async () => {
    const orderId = await getOrderId();
    const order = await service.getOrder(orderId);
    expectSchemaToValidate(getOrderSchema(), order);
  });

  test("getOrderDetails", async () => {
    const orderId = await getOrderId();
    const orderDetails = await service.getOrderDetails(orderId);
    expectSchemaToValidate(getOrderDetailsSchema(), orderDetails);
  });
});
