/* eslint-disable */

import prompts from "prompts";
import { GrocerSearchService } from "./grocer/search/grocer-search-service";
import { GrocerStoreService } from "./grocer/stores/grocer-store-service";
import { GrocyShoppingLocationService } from "./grocy/shopping-locations/grocy-shopping-location-service";
import { generateTypes } from "./jtd/generate-types";

export async function dev() {
  const storeService = new GrocerStoreService();
  const stores = await storeService.promptForStores();
  const search = new GrocerSearchService();
  const { query } = await prompts({
    type: "text",
    name: "query",
    message: "Search for a product",
  });
  await search.searchAndSelectProduct(
    query as string,
    stores.map((store) => store.id)
  );
}

async function _generate() {
  const shoppingLocationService = new GrocyShoppingLocationService();
  const locations = await shoppingLocationService.getShoppingLocations();
  await generateTypes("ShoppingLocations", "src/grocy/shopping-locations", locations);
}

/* eslint-enable */
