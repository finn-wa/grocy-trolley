import { GrocerSearchService } from "@gt/grocer/search/grocer-search-service";
import { GrocerStoreService } from "@gt/grocer/stores/grocer-store-service";
import { GrocyServices } from "@gt/grocy";
import { Logger } from "@gt/utils/logger";

export class GrocerShoppingListService {
  private readonly logger = new Logger(this.constructor.name);
  // features
  // find barcodes of products - with updates to grocy
  // resolve child products of parents
  // how to transfer to user browser though?
  // generate script?

  constructor(
    private readonly grocy: Pick<
      GrocyServices,
      "productService" | "parentProductService" | "shoppingListService"
    >,
    private readonly searchService: GrocerSearchService,
    private readonly storeService: GrocerStoreService
  ) {}

  async importGrocyShoppingList(shoppingListId?: string, storeIds?: number[]) {
    if (!shoppingListId) {
      const id = await this.grocy.shoppingListService.selectShoppingList();
      if (id === null) {
        return;
      }
      shoppingListId = id;
    }
    const shoppingList = await this.grocy.shoppingListService.getShoppingList(shoppingListId);
    if (!storeIds) {
      const stores = await this.storeService.promptForStores();
      storeIds = stores.map((store) => store.id);
    }
    const parentProducts = await this.grocy.parentProductService.getParentProducts();
    for (const item of shoppingList.items) {
      if (item.product_id in parentProducts) {
        continue;
      }
      const product = await this.grocy.productService.getProduct(item.product_id);
      console.log(product.barcode);
      // this is always true because barcode isn't returned for get requests
      if (!product.barcode) {
        console.log(`No barcode found for "${product.name}", searching grocer`);
        const grocerProduct = await this.searchService.searchAndSelectProduct(
          product.name,
          storeIds
        );
        if (grocerProduct === null) {
          return;
        }
        this.logger.debug(`Adding barcode ${grocerProduct.id} to grocy product...`);
        await this.grocy.productService.addProductBarcode(product.id, grocerProduct.id.toString());
        // }
      }
    }
  }
}
