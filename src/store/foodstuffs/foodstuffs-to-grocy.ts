import {
  GrocyConfigService,
  GrocyLocation,
  QuantityUnitName,
} from "@grocy-trolley/grocy/grocy-config";
import { FoodstuffsProduct, FoodstuffsListService } from ".";
import { FoodstuffsOrderService as FoodstuffsOrderService } from "./foodstuffs-orders";

export class FoodstuffsToGrocyService {
  private unitIds?: Record<QuantityUnitName, number>;
  private locationIds?: Record<GrocyLocation, number>;

  constructor(
    private readonly orderService: FoodstuffsOrderService,
    private readonly listService: FoodstuffsListService,
    private readonly grocyConfigService: GrocyConfigService
  ) {}

  async init(): Promise<void> {
    this.unitIds = await this.grocyConfigService.getQuantityUnitIds();
    this.locationIds = await this.grocyConfigService.getLocationIds();
  }

  async importProductsFromOrders(): Promise<void> {
    const orders = await this.orderService.getOrders();
    for (const order of orders) {
      this.importProductsFromOrder(order.orderNumber);
    }
  }

  async importProductsFromOrder(orderNumber: string): Promise<void> {
    const orderDetail = await this.orderService.getOrderDetails(orderNumber);
    const list = await this.listService.createListFromOrder(orderDetail);
    // return this.importProductsToGrocy(list.products);
  }

  async importProductsToGrocy(products: FoodstuffsProduct[]) {}
}
