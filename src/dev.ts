/* eslint-disable */

import { GrocerSearchService } from "./grocer/search/grocer-search-service";
import { GrocerStoreService } from "./grocer/stores/grocer-store-service";
import { grocyServices } from "./grocy";
import { generateTypes } from "./jtd/generate-types";

async function generate() {
  const grocy = await grocyServices();
  const barcodes = await grocy.productService.getProductBarcodes();
  await generateTypes("ProductBarcodes", "src/grocy/products", barcodes);
}

export async function dev() {
  // return generate();
  const storeService = new GrocerStoreService();
  const stores = await storeService.promptForStores();
  const search = new GrocerSearchService();
  // const { query } = await prompts({
  //   type: "text",
  //   name: "query",
  //   message: "Search for a product",
  // });
  const grocy = await grocyServices();
  const barcodes = await grocy.productService.getProductBarcodes();
  const productsWithBarcodes = barcodes.map((b) => b.product_id);
  for (const product of await grocy.productService.getAllProducts()) {
    if (
      product.barcode ||
      product.name.includes("(Generic)") ||
      productsWithBarcodes.includes(product.id)
    ) {
      continue;
    }
    console.log(product.name);
    const grocerProduct = await search.searchAndSelectProduct(
      product.name,
      stores.map((store) => store.id)
    );
    if (grocerProduct) {
      console.log(grocerProduct.id);
      await grocy.productService.addProductBarcode(product.id, grocerProduct.id.toString());
    }
  }
}

/* eslint-enable */
