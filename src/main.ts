import {
  FoodstuffsAuthService,
  FoodstuffsCartImporter,
  FoodstuffsCartService,
  FoodstuffsListImporter,
  FoodstuffsListService,
  FoodstuffsOrderImporter,
  FoodstuffsOrderService,
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
  const grocyIdMapService = new GrocyIdMapService();
  const grocyIdMaps = await grocyIdMapService.getAllIdMaps();
  const authService = new FoodstuffsAuthService();
  const cartImporter = new FoodstuffsCartImporter(
    new FoodstuffsCartService(authService),
    new GrocyProductService(),
    grocyIdMaps
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
