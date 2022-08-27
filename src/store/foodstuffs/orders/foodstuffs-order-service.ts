import { Logger } from "@gt/utils/logger";
import { Lifecycle, scoped } from "tsyringe";
import { FoodstuffsAuthHeaderProvider } from "../rest/foodstuffs-auth-header-provider";
import { FoodstuffsRestService } from "../rest/foodstuffs-rest-service";
import {
  FoodstuffsOrder,
  FoodstuffsOrderDetails,
  FoodstuffsOrdersResponse,
} from "./foodstuffs-order.model";

@scoped(Lifecycle.ContainerScoped)
export class FoodstuffsOrderService extends FoodstuffsRestService {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(userAgent: FoodstuffsAuthHeaderProvider) {
    super(userAgent);
  }

  async getOrders(): Promise<FoodstuffsOrder[]> {
    const headersBuilder = await this.authHeaders();
    const response: FoodstuffsOrdersResponse = await this.getAndParse(
      this.buildUrl("Checkout/Orders"),
      { headers: headersBuilder.acceptJson().build() }
    );
    return response.orders;
  }

  async getOrderDetails(id: string): Promise<FoodstuffsOrderDetails> {
    const headersBuilder = await this.authHeaders();
    return this.getAndParse(this.buildUrl("Checkout/OrderDetails", { id }), {
      headers: headersBuilder.acceptJson().build(),
    });
  }
}
