/* eslint-disable */

import { GrocerApiService } from "./grocer/api/grocer-api-service";
import { generateTypes } from "./jtd/generate-types";

export async function dev() {
  await _generate();
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
