import { ajvCompile } from "@gt/utils/ajv";
import { Logger } from "@gt/utils/logger";
import { COUNTDOWN_URL } from "../models";
import { CountdownRestService } from "../rest/countdown-rest-service";
import { Order } from "./types/getOrder";
import getOrderSchema from "./types/getOrder/schema.json";
import { OrderDetails } from "./types/getOrderDetails";
import getOrderDetailsSchema from "./types/getOrderDetails/schema.json";
import { Orders } from "./types/getOrders";
import getOrdersSchema from "./types/getOrders/schema.json";

const serialisation = {
  getOrder: ajvCompile<Order>(getOrderSchema),
  getOrders: ajvCompile<Orders>(getOrdersSchema),
  getOrderDetails: ajvCompile<OrderDetails>(getOrderDetailsSchema),
};

export class CountdownOrderService extends CountdownRestService {
  protected readonly logger = new Logger(this.constructor.name);
  protected readonly baseUrl = this.validateBaseUrl(
    `${COUNTDOWN_URL}/api/v1/shoppers/my/past-orders`
  );

  async getOrders(): Promise<Orders> {
    const builder = await this.authHeaders();
    return this.getAndParse(
      this.baseUrl,
      { headers: builder.acceptJson().build() },
      serialisation.getOrders.parser
    );
  }

  async getOrder(id: number): Promise<Order> {
    const builder = await this.authHeaders();
    return this.getAndParse(
      this.buildUrl(id.toString()),
      { headers: builder.acceptJson().build() },
      serialisation.getOrder.parser
    );
  }

  async getOrderDetails(id: number): Promise<OrderDetails> {
    const builder = await this.authHeaders();
    return this.getAndParse(
      this.buildUrl(`${id}/items`),
      { headers: builder.acceptJson().build() },
      serialisation.getOrderDetails.parser
    );
  }
}

type x = keyof CountdownOrderService;
