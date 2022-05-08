import { Logger } from "@gt/utils/logger";
import { FoodstuffsRestService } from "../rest/foodstuffs-rest-service";
import { FoodstuffsUserAgent } from "../rest/foodstuffs-user-agent";
import {
  FoodstuffsOrder,
  FoodstuffsOrderDetails,
  FoodstuffsOrdersResponse,
} from "./foodstuffs-order.model";

export class FoodstuffsOrderService extends FoodstuffsRestService {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(userAgent: FoodstuffsUserAgent) {
    super(userAgent);
  }

  async getOrders(): Promise<FoodstuffsOrder[]> {
    const headersBuilder = await this.authHeaders();
    const response: FoodstuffsOrdersResponse = await this.getForJson(
      this.buildUrl("Checkout/Orders"),
      headersBuilder.acceptJson().build()
    );
    return response.orders;
  }

  async getOrderDetails(id: string): Promise<FoodstuffsOrderDetails> {
    const headersBuilder = await this.authHeaders();
    return this.getForJson(
      this.buildUrl("Checkout/OrderDetails", { id }),
      headersBuilder.acceptJson().build()
    );
  }
}
