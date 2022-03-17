import { BarcodeBuddyService } from "barcodebuddy/scraper";
import { GrocyServices } from "grocy";
import { TaggunReceiptScanner } from "receipt-ocr";
import { FoodstuffsServices } from "..";
import { FoodstuffsBarcodeImporter } from "./barcode-importer";
import { FoodstuffsCartImporter } from "./cart-importer";
import { FoodstuffsListImporter } from "./list-importer";
import { FoodstuffsOrderImporter } from "./order-importer";
import { FoodstuffsToGrocyConverter } from "./product-converter";
import { FoodstuffsReceiptImporter } from "./receipt-importer";

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
