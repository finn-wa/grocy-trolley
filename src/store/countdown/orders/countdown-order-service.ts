import { Logger } from "@gt/utils/logger";
import { Lifecycle, scoped } from "tsyringe";
import { COUNTDOWN_URL } from "../models";
import { CountdownAuthHeaderProvider } from "../rest/countdown-auth-header-provider";
import { CountdownRestService } from "../rest/countdown-rest-service";
import { Order } from "./types/Order";
import { getOrderSchema } from "./types/Order/schema";
import { OrderDetails } from "./types/OrderDetails";
import { getOrderDetailsSchema } from "./types/OrderDetails/schema";
import { Orders } from "./types/Orders";
import { getOrdersSchema } from "./types/Orders/schema";

@scoped(Lifecycle.ContainerScoped)
export class CountdownOrderService extends CountdownRestService {
  protected readonly logger = new Logger(this.constructor.name);
  protected readonly baseUrl = this.validateBaseUrl(
    `${COUNTDOWN_URL}/api/v1/shoppers/my/past-orders`
  );

  constructor(authHeaderProvider: CountdownAuthHeaderProvider) {
    super(authHeaderProvider);
  }

  async getOrders(): Promise<Orders> {
    const builder = await this.authHeaders();
    return this.getAndParse(
      this.baseUrl,
      { headers: builder.acceptJson().build() },
      getOrdersSchema()
    );
  }

  async getOrder(id: number): Promise<Order> {
    const builder = await this.authHeaders();
    return this.getAndParse(
      this.buildUrl(id.toString()),
      { headers: builder.acceptJson().build() },
      getOrderSchema()
    );
  }

  async getOrderDetails(id: number): Promise<OrderDetails> {
    const builder = await this.authHeaders();
    return this.getAndParse(
      this.buildUrl(`${id}/items`),
      { headers: builder.acceptJson().build() },
      getOrderDetailsSchema()
    );
  }
}
