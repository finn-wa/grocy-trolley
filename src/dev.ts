/* eslint-disable */

import prompts from "prompts";
import { GrocerShoppingListService } from "./grocer/grocy/export/grocer-grocy-shopping-list-exporter";
import { GrocerSearchService } from "./grocer/search/grocer-search-service";
import { GrocerStoreService } from "./grocer/stores/grocer-store-service";
import { GrocerUserAgent } from "./grocer/user-agent/grocer-user-agent";
import { grocyServices } from "./grocy";
import { GrocyShoppingListService } from "./grocy/shopping-lists/grocy-shopping-list-service";
import { generateTypes } from "./jtd/generate-types";
import { getBrowser } from "./store/shared/rest/browser";
import { prettyPrint } from "./utils/logger";

async function generate() {
  const grocy = await grocyServices();
  const lists = await grocy.shoppingListService.getShoppingLists();
  await generateTypes(
    {
      typeName: "ShoppingList",
      sourceDir: "src/grocy/shopping-lists",
      generateArrayType: true,
    },
    ...lists
  );
}

export async function dev() {
  const search = new GrocerSearchService();
  const store = new GrocerStoreService();
  const stores = await store.promptForStores();
  const result = await search.searchAndSelectProduct(
    "stick",
    stores.map((store) => store.id)
  );
  console.log(prettyPrint(result));
  return;
  const grocy = await grocyServices();
  const grocer = new GrocerShoppingListService(
    grocy,
    new GrocerSearchService(),
    new GrocerStoreService(),
    new GrocerUserAgent(() => getBrowser({ headless: false }))
  );
  // console.log(await grocy.productService.getProductBarcodes("374"));
  // const list = await grocy.shoppingListService.promptForShoppingList();
  // console.log(list);
  // const items = await grocy.shoppingListService.getShoppingListItems(list ?? undefined);
  // console.log(items);
  await grocer.importGrocyShoppingList();
  await prompts({ type: "confirm", message: "exit?", name: "value" });
}

/* eslint-enable */
