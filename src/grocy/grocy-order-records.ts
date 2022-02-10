import { Response } from "node-fetch";
import { CreatedObjectResponse, OrderRecord } from ".";
import { GrocyTrue } from "./grocy-model";
import { GrocyRestService } from "./grocy-rest-service";
import { GrocyUserEntityService } from "./grocy-user-entities";

export class GrocyOrderRecordService extends GrocyRestService {
  readonly entityName = "order";

  constructor(
    apiKey: string,
    readonly baseUrl: string,
    private readonly userEntityService: GrocyUserEntityService
  ) {
    super(apiKey);
  }

  async getOrderRecords(): Promise<OrderRecord[]> {
    return this.userEntityService.getObjectsForUserEntity(this.entityName);
  }

  /**
   * Gets an order
   * @param orderId Order ID from store
   * @returns Order record
   */
  async getOrderRecord(orderId: string): Promise<OrderRecord> {
    const orders = await this.getOrderRecords();
    const order = orders.find((order) => order.orderId === orderId);
    if (!order) {
      throw new Error(`Order with ID ${orderId} not found.`);
    }
    return order;
  }

  async createOrderRecord(order: OrderRecord): Promise<CreatedObjectResponse> {
    return this.userEntityService.createUserObject(this.entityName, order);
  }

  async markOrderAsImported(objectId: string): Promise<Response> {
    return this.userEntityService.patchUserObject(this.entityName, objectId, {
      imported: GrocyTrue,
    });
  }
}
