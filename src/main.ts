import { exit } from "process";
import prompts from "prompts";
import { BarcodeBuddyScraper } from "./barcodebuddy/scraper";
import { getEnv } from "./env";
import {
  GrocyIdMapService,
  GrocyOrderRecordService,
  GrocyProductService,
  GrocyUserEntityService,
} from "./grocy";
import { GrocyStockService } from "./grocy/grocy-stock";
import { FoodstuffsSearchService } from "./store/foodstuffs";
import { FoodstuffsAuthService } from "./store/foodstuffs/foodstuffs-auth";
import { FoodstuffsCartService } from "./store/foodstuffs/foodstuffs-cart";
import { FoodstuffsListService } from "./store/foodstuffs/foodstuffs-lists";
import { FoodstuffsOrderService } from "./store/foodstuffs/foodstuffs-orders";
import { FoodstuffsToGrocyConverter } from "./store/foodstuffs/grocy/foodstuffs-converter";
import {
  FoodstuffsBarcodesImporter,
  FoodstuffsCartImporter,
  FoodstuffsListImporter,
  FoodstuffsOrderImporter,
} from "./store/foodstuffs/grocy/foodstuffs-importers";
import { Logger } from "./utils/logger";

type Action =
  | "IMPORT_CART"
  | "IMPORT_ORDER"
  | "IMPORT_LIST"
  | "IMPORT_RECEIPT"
  | "GET_BARCODES"
  | "EXIT";

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
      name: "action",
      message: "Select an action",
      type: "select",
      choices: [
        { title: "Import from cart", value: "IMPORT_CART" },
        { title: "Import latest orders", value: "IMPORT_ORDER" },
        { title: "Import from list", value: "IMPORT_LIST" },
        { title: "Import from receipt", value: "IMPORT_RECEIPT" },
        { title: "Get barcodes from BB", value: "GET_BARCODES" },
        { title: "Exit", value: "EXIT" },
      ],
    },
  ]);

  const choice = response["action"] as Action;
  if (choice === "EXIT") {
    return;
  }
  if (choice === "IMPORT_RECEIPT") {
    console.log("Not yet");
    return;
  }

  await authService.login();
  if (choice === "IMPORT_CART") {
    return cartImporter.importProductsFromCart();
  }
  if (choice === "IMPORT_LIST") {
    const listImporter = new FoodstuffsListImporter(
      cartImporter,
      new FoodstuffsListService(authService)
    );
    return listImporter.selectAndImportList();
  }
  if (choice === "IMPORT_ORDER") {
    const orderImporter = new FoodstuffsOrderImporter(
      cartImporter,
      new FoodstuffsOrderService(authService),
      new GrocyOrderRecordService(new GrocyUserEntityService())
    );
    return orderImporter.importLatestOrders();
  }
  if (choice === "GET_BARCODES") {
    const bcImporter = new FoodstuffsBarcodesImporter(
      new BarcodeBuddyScraper(),
      new GrocyProductService(),
      new FoodstuffsSearchService(),
      cartImporter
    );
    return bcImporter.importFromBarcodeBuddy();
  }
}

async function test() {
  const svc = new GrocyProductService();
  await svc.deleteAllChildProducts();
}

main().then(
  () => exit(0),
  (err) => {
    console.error(err);
    exit(1);
  }
);
