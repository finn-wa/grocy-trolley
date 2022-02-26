import {
  FoodstuffsAuthService,
  FoodstuffsCartService,
  FoodstuffsListService,
  FoodstuffsOrderService,
} from "@grocy-trolley/store/foodstuffs";
import { exit } from "process";
import prompts from "prompts";
import { getEnv } from "./env";
import {
  GrocyIdMapService,
  GrocyOrderRecordService,
  GrocyProductService,
  GrocyUserEntityService,
} from "./grocy";
import { FoodstuffsToGrocyConverter } from "./store/foodstuffs/grocy/foodstuffs-converter";
import {
  FoodstuffsCartImporter,
  FoodstuffsListImporter,
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
    new GrocyProductService()
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
    const listImporter = new FoodstuffsListImporter(
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
    return orderImporter.importLatestOrders();
  }
}

main().then(
  () => exit(0),
  (err) => {
    console.error(err);
    exit(1);
  }
);
