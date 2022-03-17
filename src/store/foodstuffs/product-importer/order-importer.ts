import { GrocyOrderRecordService } from "@grocy-trolley/grocy";
import { GrocyFalse, GrocyTrue } from "@grocy-trolley/grocy/grocy-model";
import { Logger } from "@grocy-trolley/utils/logger";
import { FoodstuffsOrderService as FoodstuffsOrderService } from "../foodstuffs-orders";
import { FoodstuffsCartImporter } from "./cart-importer";

export class FoodstuffsOrderImporter {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private readonly cartImporter: FoodstuffsCartImporter,
    private readonly orderService: FoodstuffsOrderService,
    private readonly orderRecordService: GrocyOrderRecordService
  ) {}

  async getUnimportedOrderNumbers(): Promise<string[]> {
    const foodstuffsOrderIds = (await this.orderService.getOrders()).map(
      (order) => order.orderNumber
    );
    const grocyOrderRecords = await this.orderRecordService.getOrderRecords();
    const importedOrderIds = grocyOrderRecords
      .filter((record) => record.imported === GrocyTrue)
      .map((record) => record.orderId);
    return foodstuffsOrderIds.filter((id) => !importedOrderIds.includes(id));
  }

  async importOrder(orderNumber: string): Promise<void> {
    this.logger.info("Importing order " + orderNumber);
    const order = await this.orderService.getOrderDetails(orderNumber);
    const record = await this.orderRecordService.createOrderRecord({
      brand: "PNS",
      date: order.summary.timeslot.date,
      orderId: orderNumber,
      imported: GrocyFalse,
    });
    await this.cartImporter.importProducts([...order.unavailableProducts, ...order.products]);
    await this.orderRecordService.markOrderAsImported(record.objectId);
  }

  async importLatestOrders(): Promise<void> {
    const unimportedOrderNumbers = await this.getUnimportedOrderNumbers();
    this.logger.info("Found unimported orders: " + unimportedOrderNumbers);
    for (const id of unimportedOrderNumbers) {
      await this.importOrder(id);
    }
  }
}
