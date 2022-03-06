import { BarcodeBuddyService } from "@grocy-trolley/barcodebuddy/scraper";
import { GrocyServices } from "@grocy-trolley/grocy";
import {
  FoodstuffsBarcodesImporter,
  FoodstuffsCartImporter,
  FoodstuffsListImporter,
  FoodstuffsOrderImporter,
  FoodstuffsServices,
  FoodstuffsToGrocyConverter,
} from "..";

export * from "./foodstuffs-importers";

export function foodstuffsImporters(
  foodstuffs: FoodstuffsServices,
  grocy: GrocyServices
): FoodstuffsImporters {
  const converter = new FoodstuffsToGrocyConverter(grocy.idMaps);
  const cartImporter = new FoodstuffsCartImporter(
    converter,
    foodstuffs.cartService,
    grocy.productService,
    grocy.stockService
  );
  return {
    cartImporter,
    listImporter: new FoodstuffsListImporter(cartImporter, foodstuffs.listService),
    orderImporter: new FoodstuffsOrderImporter(
      cartImporter,
      foodstuffs.orderService,
      grocy.orderRecordService
    ),
    barcodeImporter: new FoodstuffsBarcodesImporter(
      cartImporter,
      new BarcodeBuddyService(),
      grocy.productService,
      foodstuffs.searchService
    ),
  };
}

export interface FoodstuffsImporters {
  cartImporter: FoodstuffsCartImporter;
  listImporter: FoodstuffsListImporter;
  orderImporter: FoodstuffsOrderImporter;
  barcodeImporter: FoodstuffsBarcodesImporter;
}
