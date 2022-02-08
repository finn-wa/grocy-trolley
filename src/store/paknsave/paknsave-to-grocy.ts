import { components } from "@grocy-trolley/grocy/api";
import { GrocyRestService } from "@grocy-trolley/grocy/grocy-rest-service";
import { postForJson } from "@grocy-trolley/utils/fetch-utils";
import { OrderedProduct, PakNSaveOrdersService } from "./paknsave-orders";

export class PakNSaveToGrocyService extends GrocyRestService {
  constructor(
    apiKey: string,
    readonly baseUrl: string,
    private readonly pnsOrderService: PakNSaveOrdersService
  ) {
    super(apiKey);
  }

  async importProductsFromOrders() {
    const orders = await this.pnsOrderService.getOrders();
    for (const order of orders) {
      this.importProductsFromOrder(order.orderNumber);
    }
  }

  async importProductsFromOrder(orderNumber: string) {
    const orderDetail = await this.pnsOrderService.getOrderDetails(orderNumber);
    for (const product of orderDetail.products) {
      this.importProduct(product);
    }
  }

  async importProduct(product: OrderedProduct) {
    // grocy
  }

  async getQuantityUnitIds(): Promise<Record<QuantityUnitName, number>> {
    const quantityUnits = await this.getQuantityUnits();
    const storedUnitNames = quantityUnits.map((unit) => unit.name);
    const missingUnits = QUANTITY_UNITS.filter(
      (unit) => !storedUnitNames.includes(unit)
    );
    if (missingUnits.length > 0) {
      throw new Error(
        `The following units are missing from grocy: '${missingUnits.join(
          ", "
        )}'`
      );
    }
    return Object.fromEntries(
      quantityUnits.map((unit) => [unit.name, unit.id])
    );
  }

  async getQuantityUnits(): Promise<QuantityUnit[]> {
    return this.getEntities<"QuantityUnit">("quantity_units");
  }
}

type Schemas = components["schemas"];
export type QuantityUnit = Schemas["QuantityUnit"];
const QUANTITY_UNITS = ["piece", "pack", "g", "kg", "mL", "L"] as const;
export type QuantityUnitName = typeof QUANTITY_UNITS[number];
