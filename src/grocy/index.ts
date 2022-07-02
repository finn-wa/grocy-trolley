import { GrocyLocationIdLookupService } from "./id-lookup/grocy-location-id-lookup-service";
import { GrocyProductGroupIdLookupService } from "./id-lookup/grocy-product-group-id-lookup-service";
import { GrocyQuantityUnitIdLookupService } from "./id-lookup/grocy-quantity-unit-id-lookup-service";
import { GrocyShoppingLocationIdLookupService } from "./id-lookup/grocy-shopping-location-id-lookup-service";
import { GrocyOrderRecordService } from "./order-records/grocy-order-record-service";
import { GrocyParentProductService } from "./products/grocy-parent-product-service";
import { GrocyProductService } from "./products/grocy-product-service";
import { GrocyShoppingListService } from "./shopping-lists/grocy-shopping-list-service";
import { GrocyStockService } from "./stock/grocy-stock-service";
import { GrocyUserEntityService } from "./user-entities/grocy-user-entity-service";

export interface GrocyIdLookupServices {
  readonly locations: GrocyLocationIdLookupService;
  readonly quantityUnits: GrocyQuantityUnitIdLookupService;
  readonly productGroups: GrocyProductGroupIdLookupService;
  readonly shoppingLocations: GrocyShoppingLocationIdLookupService;
}

export function grocyIdLookupServices(): GrocyIdLookupServices {
  return {
    locations: new GrocyLocationIdLookupService(),
    quantityUnits: new GrocyQuantityUnitIdLookupService(),
    productGroups: new GrocyProductGroupIdLookupService(),
    shoppingLocations: new GrocyShoppingLocationIdLookupService(),
  };
}

export interface GrocyServices {
  readonly idLookupServices: GrocyIdLookupServices;
  readonly userEntityService: GrocyUserEntityService;
  readonly orderRecordService: GrocyOrderRecordService;
  readonly productService: GrocyProductService;
  readonly parentProductService: GrocyParentProductService;
  readonly stockService: GrocyStockService;
  readonly shoppingListService: GrocyShoppingListService;
}

export async function grocyServices(): Promise<GrocyServices> {
  const idLookupServices = grocyIdLookupServices();
  const userEntityService = new GrocyUserEntityService();
  const productService = new GrocyProductService();
  const stockService = new GrocyStockService();
  const shoppingListService = new GrocyShoppingListService();

  const parentProductService = new GrocyParentProductService(
    idLookupServices.productGroups,
    productService
  );
  const orderRecordService = new GrocyOrderRecordService(userEntityService);

  return {
    idLookupServices,
    userEntityService,
    orderRecordService,
    productService,
    parentProductService,
    stockService,
    shoppingListService,
  };
}
