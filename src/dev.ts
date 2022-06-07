/* eslint-disable */

import { GrocerApiService } from "./grocer/api/grocer-api-service";
import { generateTypes } from "./jtd/generate-types";

export async function dev() {
  await _generate();
}

async function _generate() {
  const grocerApi = new GrocerApiService();
  const orders = await grocerApi.getStores();
  await generateTypes("Stores", "src/grocer/api", orders);
}

/* eslint-enable */
