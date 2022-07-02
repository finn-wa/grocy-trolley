/* eslint-disable */

import { GrocerApiService } from "./grocer/api/grocer-api-service";
import { grocyServices } from "./grocy";
import { GrocyShoppingLocationService } from "./grocy/shopping-locations/grocy-shopping-location-service";
import { generateTypes } from "./jtd/generate-types";
import { foodstuffsImporters } from "./store/foodstuffs/grocy/import";
import { foodstuffsServices } from "./store/foodstuffs/services";

export async function dev() {
  return _generate();
  const foodstuffs = await foodstuffsServices();
  const { receiptImporter } = foodstuffsImporters(foodstuffs, await grocyServices());
  await receiptImporter.importReceiptListRefs({
    "Kelloggs Coco Pops Chex 500g": { productId: "5017640-EA-000", quantity: 1, saleType: "UNITS" },
  });
}

async function _generate() {
  const shoppingLocationService = new GrocyShoppingLocationService();
  const locations = await shoppingLocationService.getShoppingLocations();
  await generateTypes("ShoppingLocations", "src/grocy/shopping-locations", locations);
}

/* eslint-enable */
