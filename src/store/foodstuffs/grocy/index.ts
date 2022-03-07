import { BarcodeBuddyService } from "@grocy-trolley/barcodebuddy/scraper";
import { GrocyServices } from "@grocy-trolley/grocy";
import { TaggunReceiptScanner } from "@grocy-trolley/receipt-ocr";
import { OcrReceiptScanner } from "@grocy-trolley/receipt-ocr/ocr/ocr";
import { FoodstuffsServices } from "..";
import { FoodstuffsBarcodeImporter } from "./foodstuffs-barcode-importer";
import { FoodstuffsCartImporter } from "./foodstuffs-cart-importer";
import { FoodstuffsToGrocyConverter } from "./foodstuffs-converter";
import { FoodstuffsListImporter } from "./foodstuffs-list-importer";
import { FoodstuffsOrderImporter } from "./foodstuffs-order-importer";
import { FoodstuffsReceiptImporter } from "./foodstuffs-receipt-importer";

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
      new TaggunReceiptScanner()
      // new OcrReceiptScanner()
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
