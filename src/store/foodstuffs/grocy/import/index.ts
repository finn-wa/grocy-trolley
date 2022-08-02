import { GrocyServices } from "grocy";
import { TaggunReceiptScanner } from "receipt-ocr";
import { FoodstuffsServices } from "../../services";
import { FoodstuffsBarcodeImporter } from "./barcode-importer";
import { FoodstuffsCartImporter } from "./cart-importer";
import { FoodstuffsListImporter } from "./list-importer";
import { FoodstuffsOrderImporter } from "./order-importer";
import { FoodstuffsToGrocyConverter } from "./product-converter";
import { FoodstuffsReceiptImporter } from "./receipt-importer";
import { FoodstuffsReceiptItemiser } from "./foodstuffs-receipt-itemiser";

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
  const converter = new FoodstuffsToGrocyConverter(
    grocy.idLookupServices,
    foodstuffs.searchService
  );
  const cartImporter = new FoodstuffsCartImporter(converter, foodstuffs.cartService, grocy);
  const listImporter = new FoodstuffsListImporter(converter, foodstuffs.listService, grocy);
  return {
    cartImporter,
    listImporter,
    orderImporter: new FoodstuffsOrderImporter(
      cartImporter,
      foodstuffs.orderService,
      grocy.orderRecordService
    ),
    barcodeImporter: new FoodstuffsBarcodeImporter(cartImporter, grocy.productService),
    receiptImporter: new FoodstuffsReceiptImporter(
      foodstuffs,
      listImporter,
      // new OcrReceiptScanner()
      new TaggunReceiptScanner(),
      new FoodstuffsReceiptItemiser(),
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
