import { GrocyIdMaps, GrocyIdMapService } from "./grocy-config";
import { GrocyOrderRecordService } from "./grocy-order-records";
import { GrocyProductService } from "./grocy-products";
import { GrocyShoppingListService } from "./grocy-shopping-lists";
import { GrocyStockService } from "./grocy-stock";
import { GrocyUserEntityService } from "./grocy-user-entities";
import { GrocyParentProductService } from "./grocy-parent-products";

export * from "./grocy-config";
export * from "./grocy-order-records";
export * from "./grocy-products";
export * from "./grocy-parent-products";
export * from "./grocy-stock";
export * from "./grocy-user-entities";

export async function grocyServices(): Promise<GrocyServices> {
  const idMapService = new GrocyIdMapService();
  const idMaps = await idMapService.getAllIdMaps();
  const userEntityService = new GrocyUserEntityService();
  const productService = new GrocyProductService();
  return {
    idMaps,
    userEntityService,
    orderRecordService: new GrocyOrderRecordService(userEntityService),
    productService,
    parentProductService: new GrocyParentProductService(idMaps, productService),
    stockService: new GrocyStockService(),
    shoppingListService: new GrocyShoppingListService(),
  };
}

export interface GrocyServices {
  readonly idMaps: GrocyIdMaps;
  readonly userEntityService: GrocyUserEntityService;
  readonly orderRecordService: GrocyOrderRecordService;
  readonly productService: GrocyProductService;
  readonly parentProductService: GrocyParentProductService;
  readonly stockService: GrocyStockService;
  readonly shoppingListService: GrocyShoppingListService;
}
