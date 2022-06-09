/* eslint-disable */

import { GrocerSearchService } from "./grocer/search/grocer-search-service";
import { generateTypes } from "./jtd/generate-types";

export async function dev() {
  await _generate();
}

async function _generate() {
  const search = new GrocerSearchService();
  const storeIds = [
    6340712107624913, 7644797357623558, 4567002660615265, 1096672562035996, 3067760475684734,
    6774892715230889,
  ];
  const indomie = await search.search("indomie", storeIds);
  const potatoes = await search.search("potatoes", storeIds);
  const muffin = await search.search("muffin", storeIds);
  await generateTypes("ProductSearchResponse", "src/grocer/search", indomie, potatoes, muffin);
}

/* eslint-enable */
