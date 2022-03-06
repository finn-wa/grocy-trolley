import { GrocyIdMaps, GrocyIdMapService } from "./grocy-config";
import { GrocyOrderRecordService } from "./grocy-order-records";
import { GrocyProductService } from "./grocy-products";
import { GrocyStockService } from "./grocy-stock";
import { GrocyUserEntityService } from "./grocy-user-entities";

export * from "./grocy-config";
export * from "./grocy-order-records";
export * from "./grocy-products";
export * from "./grocy-stock";
export * from "./grocy-user-entities";

export async function grocyServices(): Promise<GrocyServices> {
  const idMapService = new GrocyIdMapService();
  const idMaps = await idMapService.getAllIdMaps();
  const userEntityService = new GrocyUserEntityService();
  return {
    idMaps,
    userEntityService,
    orderRecordService: new GrocyOrderRecordService(userEntityService),
    productService: new GrocyProductService(),
    stockService: new GrocyStockService(),
  };
}

export interface GrocyServices {
  idMaps: GrocyIdMaps;
  userEntityService: GrocyUserEntityService;
  orderRecordService: GrocyOrderRecordService;
  productService: GrocyProductService;
  stockService: GrocyStockService;
}
