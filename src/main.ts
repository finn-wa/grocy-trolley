import { EnvParser } from "@grocy-trolley/env";
import {
  FoodstuffsAuthService,
  FoodstuffsCartService,
  FoodstuffsListService,
  FoodstuffsOrderService,
  FoodstuffsCartImporter,
  PAKNSAVE_URL,
  FoodstuffsListImporter,
  FoodstuffsOrderImporter,
} from "@grocy-trolley/store/foodstuffs";
import { exit } from "process";
import prompts from "prompts";
import {
  GrocyIdMapService,
  GrocyOrderRecordService,
  GrocyProductService,
  GrocyUserEntityService,
} from "./grocy";

type ImportMethod = "IMPORT_CART" | "IMPORT_ORDER" | "IMPORT_LIST" | "IMPORT_RECEIPT";

async function main() {
  const env = new EnvParser("env.json").env;
  const grocyCfg = { apiKey: env.GROCY_API_KEY, baseUrl: env.GROCY_URL };
  const grocyIdMapService = new GrocyIdMapService(grocyCfg);
  const grocyIdMaps = await grocyIdMapService.getAllIdMaps();
  const authService = new FoodstuffsAuthService(
    PAKNSAVE_URL,
    env.PAKNSAVE_EMAIL,
    env.PAKNSAVE_PASSWORD
  );
  const cartImporter = new FoodstuffsCartImporter(
    new FoodstuffsCartService(authService),
    new GrocyProductService(grocyCfg),
    grocyIdMaps
  );

  const response = await prompts([
    {
      name: "importMethod",
      message: "Select an import method",
      type: "select",
      choices: [
        { title: "Import from cart", value: "IMPORT_CART" },
        { title: "Import from order", value: "IMPORT_ORDER" },
        { title: "Import from list", value: "IMPORT_LIST" },
        { title: "Import from receipt", value: "IMPORT_RECEIPT" },
      ],
    },
  ]);
  await authService.login();
  const importMethod: ImportMethod = response["importMethod"];

  if (importMethod === "IMPORT_RECEIPT") {
    return;
  }
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
      new GrocyOrderRecordService(grocyCfg, new GrocyUserEntityService(grocyCfg))
    );
    return orderImporter.importLatestOrders();
  }

  // return importer.
}

main().then(
  () => exit(0),
  (err) => {
    console.error(err);
    exit(1);
  }
);
