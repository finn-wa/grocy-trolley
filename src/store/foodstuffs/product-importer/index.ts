import { BarcodeBuddyService } from "@grocy-trolley/barcodebuddy/scraper";
import { GrocyServices } from "@grocy-trolley/grocy";
import { TaggunReceiptScanner } from "@grocy-trolley/receipt-ocr";
import { FoodstuffsServices } from "..";
import { FoodstuffsToGrocyConverter } from "./product-converter";
import { FoodstuffsOrderImporter } from "./order-importer";
import { FoodstuffsReceiptImporter } from "./receipt-importer";
import { FoodstuffsBarcodeImporter } from "./barcode-importer";
import { FoodstuffsCartImporter } from "./cart-importer";
import { FoodstuffsListImporter } from "./list-importer";

export {
  FoodstuffsBarcodeImporter,
  FoodstuffsCartImporter,
  FoodstuffsToGrocyConverter,
  FoodstuffsListImporter,
  FoodstuffsOrderImporter,
};

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
    barcodeImporter: new FoodstuffsBarcodeImporter(
      cartImporter,
      new BarcodeBuddyService(),
      grocy.productService,
      foodstuffs.searchService
    ),
    receiptImporter: new FoodstuffsReceiptImporter(
      cartImporter,
      foodstuffs.searchService,
      // new OcrReceiptScanner()
      new TaggunReceiptScanner(),
      grocy.productService
    ),
  };
}

export interface FoodstuffsImporters {
  cartImporter: FoodstuffsCartImporter;
  listImporter: FoodstuffsListImporter;
  orderImporter: FoodstuffsOrderImporter;
  barcodeImporter: FoodstuffsBarcodeImporter;
  receiptImporter: FoodstuffsReceiptImporter;
}
