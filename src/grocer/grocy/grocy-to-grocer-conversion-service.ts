import { GrocerSearchService } from "@gt/grocer/search/grocer-search-service";
import { GrocerStoreService } from "@gt/grocer/stores/grocer-store-service";
import { GrocerUserAgent } from "@gt/grocer/user-agent/grocer-user-agent";
import { GrocyParentProductService } from "@gt/grocy/products/grocy-parent-product-service";
import { GrocyProductService } from "@gt/grocy/products/grocy-product-service";
import { GrocyShoppingListService } from "@gt/grocy/shopping-lists/grocy-shopping-list-service";
import {
  NewShoppingListItem,
  ShoppingListItem,
} from "@gt/grocy/shopping-lists/types/ShoppingListItems";
import { cloneItemForList } from "@gt/grocy/shopping-lists/types/ShoppingListItems/schema";
import { Logger } from "@gt/utils/logger";
import { singleton } from "tsyringe";

@singleton()
export class GrocyToGrocerConversionService {
  private readonly logger = new Logger(this.constructor.name);
  // features
  // find barcodes of products - with updates to grocy
  // resolve child products of parents
  // how to transfer to user browser though?
  // generate script?

  constructor(
    private readonly grocyProductService: GrocyProductService,
    private readonly grocyParentProductService: GrocyParentProductService,
    private readonly grocyShoppingListService: GrocyShoppingListService,
    private readonly searchService: GrocerSearchService,
    private readonly storeService: GrocerStoreService,
    private readonly agent: GrocerUserAgent
  ) {}

  async grocyListToGrocerList(shoppingListId?: string, storeIds?: number[]) {
    if (!shoppingListId) {
      const id = await this.grocyShoppingListService.promptForShoppingList();
      if (id === null) {
        return;
      }
      shoppingListId = id;
    }
    const shoppingList = await this.grocyShoppingListService.getShoppingList(shoppingListId);
    if (!storeIds) {
      const stores = await this.storeService.promptForStores();
      storeIds = stores.map((store) => store.id);
    }
    const barcodesToAdd: number[] = [];
    const resolvedItems = await this.resolveParentProducts(shoppingList.items);
    const listName = `${shoppingList.name} - Grocer Export ${new Date().toISOString()}`;
    this.logger.info(`Saving items to new list: ${listName}`);
    await this.grocyShoppingListService.createShoppingList(listName, resolvedItems);
    for (const item of resolvedItems) {
      const product = await this.grocyProductService.getProduct(item.product_id);
      const barcodes = await this.grocyProductService.getProductBarcodes(item.product_id);
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
        await this.grocyProductService.addProductBarcode(product.id, grocerProduct.id.toString());
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

  private async resolveParentProducts(
    shoppingListItems: ShoppingListItem[]
  ): Promise<NewShoppingListItem[]> {
    const parentProducts = await this.grocyParentProductService.getParentProducts();
    const resolvedItems: NewShoppingListItem[] = [];
    for (const item of shoppingListItems) {
      const parent = parentProducts[item.product_id];
      if (!parent) {
        resolvedItems.push(cloneItemForList(item, ""));
      } else {
        const child = await this.grocyParentProductService.promptForChild(parent);
        if (child) {
          resolvedItems.push(cloneItemForList({ ...item, product_id: child.id }, ""));
        }
      }
    }
    return resolvedItems;
  }
}
