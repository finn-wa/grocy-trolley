import { Logger } from "@grocy-trolley/utils/logger";
import { Response } from "node-fetch";
import { CreatedObjectResponse, OrderRecord } from ".";
import { GrocyTrue } from "./grocy-model";
import { GrocyRestService } from "./grocy-rest-service";
import { GrocyUserEntityService } from "./grocy-user-entities";

const ORDER = "order";

export class GrocyOrderRecordService extends GrocyRestService {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(private readonly userEntityService: GrocyUserEntityService) {
    super();
  }

  async getOrderRecords(): Promise<OrderRecord[]> {
    return this.userEntityService.getObjectsForUserEntity(ORDER);
  }

  async getOrderRecord(id: string | number): Promise<OrderRecord> {
    return this.userEntityService.getUserObject(ORDER, id);
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
    return this.userEntityService.createUserObject(ORDER, order);
  }

  async markOrderAsImported(objectId: string | number): Promise<Response> {
    const record = await this.getOrderRecord(objectId);
    return this.userEntityService.updateUserObject(ORDER, objectId, {
      ...record,
      imported: GrocyTrue,
    });
  }
}
