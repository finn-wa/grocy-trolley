import { GrocerSearchService } from "@gt/grocer/search/grocer-search-service";
import { GrocerStoreService } from "@gt/grocer/stores/grocer-store-service";
import { GrocerUserAgent } from "@gt/grocer/user-agent/grocer-user-agent";
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
    private readonly storeService: GrocerStoreService,
    private readonly agent: GrocerUserAgent
  ) {}

  async importGrocyShoppingList(shoppingListId?: string, storeIds?: number[]) {
    if (!shoppingListId) {
      const id = await this.grocy.shoppingListService.promptForShoppingList();
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
    const barcodesToAdd: number[] = [];
    for (const item of shoppingList.items) {
      if (item.product_id in parentProducts) {
        continue;
      }
      const product = await this.grocy.productService.getProduct(item.product_id);
      const barcodes = await this.grocy.productService.getProductBarcodes(item.product_id);

      // this is always true because barcode isn't returned for get requests
      if (barcodes.length === 0) {
        console.log(`No barcode found for "${product.name}", searching grocer`);
        const grocerProduct = await this.searchService.searchAndSelectProduct(
          product.name,
          storeIds
        );
        if (grocerProduct === null) {
          continue;
        }
        this.logger.debug(`Adding barcode ${grocerProduct.id} to grocy product...`);
        await this.grocy.productService.addProductBarcode(product.id, grocerProduct.id.toString());
        barcodesToAdd.push(grocerProduct.id);
      } else {
        barcodesToAdd.push(Number(barcodes[0].barcode));
      }
    }
    await this.agent.putKeyvalStore({
      selectedStoreIds: storeIds,
      list: barcodesToAdd.map((barcode) => ({ id: barcode, quantity: 1, isChecked: false })),
    });
  }
}
