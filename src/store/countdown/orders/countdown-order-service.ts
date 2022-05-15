import { Logger } from "@gt/utils/logger";
import { COUNTDOWN_URL } from "../models";
import { CountdownRestService } from "../rest/countdown-rest-service";
import { Order } from "./types/getOrder";
import { OrderSchema } from "./types/getOrder/schema";
import { OrderDetailsSchema } from "./types/getOrderDetails/schema";
import { Orders } from "./types/getOrders";
import { OrdersSchema } from "./types/getOrders/schema";

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
      OrdersSchema.parseResponse
    );
  }

  async getOrder(id: number): Promise<Order> {
    const builder = await this.authHeaders();
    return this.getAndParse(
      this.buildUrl(id.toString()),
      { headers: builder.acceptJson().build() },
      OrderSchema.parseResponse
    );
  }

  async getOrderDetails(id: number): Promise<unknown> {
    const builder = await this.authHeaders();
    return this.getAndParse(
      this.buildUrl(`${id}/items`),
      { headers: builder.acceptJson().build() },
      OrderDetailsSchema.parseResponse
    );
  }
}
