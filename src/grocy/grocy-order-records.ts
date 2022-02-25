import { Response } from "node-fetch";
import { CreatedObjectResponse, OrderRecord } from ".";
import { GrocyTrue } from "./grocy-model";
import { GrocyRestService } from "./grocy-rest-service";
import { GrocyUserEntityService } from "./grocy-user-entities";

export class GrocyOrderRecordService extends GrocyRestService {
  readonly entityName = "order";

  constructor(private readonly userEntityService: GrocyUserEntityService) {
    super();
  }

  async getOrderRecords(): Promise<OrderRecord[]> {
    return this.userEntityService.getObjectsForUserEntity(this.entityName);
  }

  async getOrderRecord(id: string | number): Promise<OrderRecord> {
    return this.userEntityService.getUserObject(this.entityName, id);
  }

  /**
   * Gets an order
   * @param orderId Order ID from store
   * @returns Order record
   */
  async getOrderRecordByStoreOrderId(orderId: string): Promise<OrderRecord> {
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

  async markOrderAsImported(objectId: string | number): Promise<Response> {
    const record = await this.getOrderRecord(objectId);
    return this.userEntityService.updateUserObject(this.entityName, objectId, {
      ...record,
      imported: GrocyTrue,
    });
  }
}
