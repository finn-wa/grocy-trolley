/* eslint-disable */

import { GrocerShoppingListService } from "./grocer/grocy/export/grocer-grocy-shopping-list-exporter";
import { GrocerSearchService } from "./grocer/search/grocer-search-service";
import { GrocerStoreService } from "./grocer/stores/grocer-store-service";
import { grocyServices } from "./grocy";
import { GrocyShoppingListService } from "./grocy/shopping-lists/grocy-shopping-list-service";
import { generateTypes } from "./jtd/generate-types";

async function generate() {
  const grocy = await grocyServices();
  const lists = await grocy.shoppingListService.getAllShoppingLists();
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
  const grocer = new GrocerShoppingListService(
    await grocyServices(),
    new GrocerSearchService(),
    new GrocerStoreService()
  );
  await grocer.importGrocyShoppingList();
}

/* eslint-enable */
