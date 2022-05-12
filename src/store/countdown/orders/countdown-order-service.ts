import { Logger } from "@gt/utils/logger";
import { COUNTDOWN_URL } from "../models";
import { CountdownRestService } from "../rest/countdown-rest-service";
import { Order } from "./types/getOrder";
import { OrderDetails } from "./types/getOrderDetails";
import { Orders } from "./types/getOrders";

export class CountdownOrderService extends CountdownRestService {
  protected readonly logger = new Logger(this.constructor.name);
  protected readonly baseUrl = this.validateBaseUrl(
    `${COUNTDOWN_URL}/api/v1/shoppers/my/past-orders`
  );

  async getOrders(): Promise<Orders> {
    const builder = await this.authHeaders();
    return this.getForJson(this.baseUrl, builder.acceptJson().build());
  }

  async getOrder(id: number): Promise<Order> {
    const builder = await this.authHeaders();
    return this.getForJson(this.buildUrl(id.toString()), builder.acceptJson().build());
  }

  async getOrderDetails(id: number): Promise<OrderDetails> {
    const builder = await this.authHeaders();
    return this.getForJson(this.buildUrl(`${id}/items`), builder.acceptJson().build());
  }
}
