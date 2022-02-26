import { exit } from "process";
import prompts from "prompts";
import { BarcodeBuddyCrawler } from "./barcodebuddy/crawler";
import { getEnv } from "./env";
import {
  GrocyIdMapService,
  GrocyOrderRecordService,
  GrocyProductService,
  GrocyUserEntityService,
} from "./grocy";
import { GrocyStockService } from "./grocy/grocy-stock";
import { FoodstuffsAuthService } from "./store/foodstuffs/foodstuffs-auth";
import { FoodstuffsCartService } from "./store/foodstuffs/foodstuffs-cart";
import { FoodstuffsListService } from "./store/foodstuffs/foodstuffs-lists";
import { FoodstuffsOrderService } from "./store/foodstuffs/foodstuffs-orders";
import { FoodstuffsToGrocyConverter } from "./store/foodstuffs/grocy/foodstuffs-converter";
import {
  FoodstuffsCartImporter,
  FoodstuffsListToCartService,
  FoodstuffsOrderImporter,
} from "./store/foodstuffs/grocy/foodstuffs-importers";
import { Logger } from "./utils/logger";

type ImportMethod = "IMPORT_CART" | "IMPORT_ORDER" | "IMPORT_LIST" | "IMPORT_RECEIPT";

const env = getEnv();
const logger = new Logger("main");

async function main() {
  const grocyIdMapService = new GrocyIdMapService();
  const grocyIdMaps = await grocyIdMapService.getAllIdMaps();
  const authService = new FoodstuffsAuthService();
  const cartImporter = new FoodstuffsCartImporter(
    new FoodstuffsToGrocyConverter(grocyIdMaps),
    new FoodstuffsCartService(authService),
    new GrocyProductService(),
    new GrocyStockService()
  );

  const response = await prompts([
    {
      name: "importMethod",
      message: "Select an import method",
      type: "select",
      choices: [
        { title: "Import from cart", value: "IMPORT_CART" },
        { title: "Import latest orders", value: "IMPORT_ORDER" },
        { title: "Import from list", value: "IMPORT_LIST" },
        { title: "Import from receipt", value: "IMPORT_RECEIPT" },
      ],
    },
  ]);

  const importMethod = response["importMethod"] as ImportMethod;
  if (importMethod === "IMPORT_RECEIPT") {
    return;
  }

  await authService.login();

  if (importMethod === "IMPORT_CART") {
    return cartImporter.importProductsFromCart();
  }
  if (importMethod === "IMPORT_LIST") {
    const listImporter = new FoodstuffsListToCartService(
      cartImporter,
      new FoodstuffsListService(authService)
    );
    return listImporter.selectAndImportList();
  }
  if (importMethod === "IMPORT_ORDER") {
    const orderImporter = new FoodstuffsOrderImporter(
      cartImporter,
      new FoodstuffsOrderService(authService),
      new GrocyOrderRecordService(new GrocyUserEntityService())
    );
    return orderImporter.getUnimportedOrderNumbers();
  }
}

async function test() {
  const bb = new BarcodeBuddyCrawler();
  const barcodes = await bb.getBarcodes();
  console.log(barcodes);
}

test().then(
  () => exit(0),
  (err) => {
    console.error(err);
    exit(1);
  }
);
