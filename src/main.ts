import { exit } from "process";
import prompts from "prompts";
import { BarcodeBuddyService } from "./barcodebuddy/scraper";
import { getEnv } from "./env";
import {
  GrocyIdMapService,
  GrocyOrderRecordService,
  GrocyProductService,
  grocyServices,
  GrocyUserEntityService,
} from "./grocy";
import { GrocyStockService } from "./grocy/grocy-stock";
import { foodstuffsServices } from "./store/foodstuffs";
import { foodstuffsImporters } from "./store/foodstuffs/grocy";
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
  const foodstuffs = foodstuffsServices();
  const grocy = await grocyServices();
  const importers = foodstuffsImporters(foodstuffs, grocy);

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

  await foodstuffs.authService.login();

  if (choice === "IMPORT_CART") {
    return importers.cartImporter.importProductsFromCart();
  }
  if (choice === "IMPORT_LIST") {
    return importers.listImporter.selectAndImportList();
  }
  if (choice === "IMPORT_ORDER") {
    return importers.orderImporter.importLatestOrders();
  }
  if (choice === "GET_BARCODES") {
    return importers.barcodeImporter.importFromBarcodeBuddy();
  }
}

async function test() {
  const svc = new BarcodeBuddyService();
  const barcodes = await svc.getBarcodes();
  console.log(barcodes);
}

main().then(
  () => exit(0),
  (err) => {
    console.error(err);
    exit(1);
  }
);
