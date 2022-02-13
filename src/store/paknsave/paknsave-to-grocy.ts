import { components } from "@grocy-trolley/grocy/api";
import {
  GrocyLocation,
  QuantityUnit,
  QuantityUnitName,
  QUANTITY_UNITS,
  GrocySchemas,
  GROCY_LOCATIONS,
} from "@grocy-trolley/grocy/grocy-model";
import { GrocyRestService } from "@grocy-trolley/grocy/grocy-rest-service";
import { postForJson } from "@grocy-trolley/utils/fetch-utils";
import { CategoryLocations } from ".";
import { OrderedProduct, PakNSaveOrderService } from "./paknsave-orders";

export class PakNSaveToGrocyService extends GrocyRestService {
  private unitIds?: Record<QuantityUnitName, number>;
  private locationIds?: Record<GrocyLocation, number>;

  constructor(
    apiKey: string,
    readonly baseUrl: string,
    private readonly pnsOrderService: PakNSaveOrderService
  ) {
    super(apiKey);
  }

  async init(): Promise<void> {
    this.unitIds = await this.getQuantityUnitIds();
    this.locationIds = await this.getLocationIds();
  }

  async importProductsFromOrders(): Promise<void> {
    const orders = await this.pnsOrderService.getOrders();
    for (const order of orders) {
      this.importProductsFromOrder(order.orderNumber);
    }
  }

  async importProductsFromOrder(orderNumber: string): Promise<void> {
    const orderDetail = await this.pnsOrderService.getOrderDetails(orderNumber);
    for (const product of orderDetail.products) {
      this.importOrderedProduct(product);
    }
  }

  async importOrderedProduct(p: OrderedProduct) {
    // grocy
  }

  async getLocationIds(): Promise<Record<GrocyLocation, number>> {
    const locations = await this.getEntities<"Location">("locations");
    const storedLocations = locations.map((unit) => unit.name);
    const missingLocations = GROCY_LOCATIONS.filter(
      (location) => !storedLocations.includes(location)
    );
    if (missingLocations.length > 0) {
      throw new Error(
        `The following locations are missing from grocy: '${missingLocations.join(
          ", "
        )}'`
      );
    }
    return Object.fromEntries(
      locations.map((unit: GrocySchemas["Location"]) => [unit.name, unit.id])
    );
  }

  async getQuantityUnitIds(): Promise<Record<QuantityUnitName, number>> {
    const quantityUnits = await this.getEntities<"QuantityUnit">(
      "quantity_units"
    );
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
}
