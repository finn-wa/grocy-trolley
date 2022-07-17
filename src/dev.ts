/* eslint-disable */

import { GrocerShoppingListService } from "./grocer/grocy/export/grocer-grocy-shopping-list-exporter";
import { GrocerSearchService } from "./grocer/search/grocer-search-service";
import { GrocerStoreService } from "./grocer/stores/grocer-store-service";
import { grocyServices } from "./grocy";
import { GrocyShoppingListService } from "./grocy/shopping-lists/grocy-shopping-list-service";
import { generateTypes } from "./jtd/generate-types";

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
  const grocy = await grocyServices();
  const grocer = new GrocerShoppingListService(
    grocy,
    new GrocerSearchService(),
    new GrocerStoreService()
  );
  const list = await grocy.shoppingListService.promptForShoppingList();
  console.log(list);
  const items = await grocy.shoppingListService.getShoppingListItems(list ?? undefined);
  console.log(items);
  // await grocer.importGrocyShoppingList();
}

/* eslint-enable */
