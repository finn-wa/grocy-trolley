/* eslint-disable */

import { GrocerApiService } from "./grocer/api/grocer-api-service";
import { grocyServices } from "./grocy";
import { generateTypes } from "./jtd/generate-types";
import { foodstuffsImporters } from "./store/foodstuffs/grocy/import";
import { foodstuffsServices } from "./store/foodstuffs/services";

export async function dev() {
  const foodstuffs = await foodstuffsServices();
  const { receiptImporter } = foodstuffsImporters(foodstuffs, await grocyServices());
  await receiptImporter.importReceiptListRefs({
    "Kelloggs Coco Pops Chex 500g": { productId: "5017640-EA-000", quantity: 1, saleType: "UNITS" },
  });
}

async function _generate() {
  const grocerApi = new GrocerApiService();
  const prices = await grocerApi.getProductPrices({
    storeIds: [
      6340712107624913, 7644797357623558, 4567002660615265, 1096672562035996, 3067760475684734,
    ],
    productIds: [632197881711860, 6343082287627326],
  });
  await generateTypes("ProductPrices", "src/grocer/api", prices);
}

/* eslint-enable */
