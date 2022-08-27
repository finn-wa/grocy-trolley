import { AppTokens } from "@gt/app/di";
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
import { PromptProvider } from "@gt/prompts/prompt-provider";
import { Logger } from "@gt/utils/logger";
import { inject, Lifecycle, scoped } from "tsyringe";

@scoped(Lifecycle.ContainerScoped)
export class GrocyToGrocerConversionService {
  private readonly logger = new Logger(this.constructor.name);
  private readonly savedListTitle = "Grocer Export";

  constructor(
    private readonly grocyProductService: GrocyProductService,
    private readonly grocyParentProductService: GrocyParentProductService,
    private readonly grocyShoppingListService: GrocyShoppingListService,
    private readonly searchService: GrocerSearchService,
    private readonly storeService: GrocerStoreService,
    private readonly agent: GrocerUserAgent,
    @inject(AppTokens.promptProvider) private readonly prompt: PromptProvider
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
      if (!stores) {
        return;
      }
      storeIds = stores.map((store) => store.id);
    }
    const grocerProductIds: number[] = [];
    const resolvedItems = await this.resolveParentProducts(shoppingList.items);
    // Save resolved products (unless we're exporting a previously resolved list)
    if (!shoppingList.name.includes(this.savedListTitle)) {
      const listName = `${shoppingList.name} - ${this.savedListTitle} ${new Date().toISOString()}`;
      this.logger.info(`Saving items to new list: ${listName}`);
      await this.grocyShoppingListService.createShoppingList(listName, resolvedItems);
    }
    for (const item of resolvedItems) {
      const product = await this.grocyProductService.getProduct(item.product_id);
      const grocerProduct = await this.searchService.searchAndSelectProduct(product.name, storeIds);
      if (grocerProduct !== null) {
        grocerProductIds.push(grocerProduct.id);
      }
    }
    await this.agent.putKeyvalStore({
      selectedStoreIds: storeIds,
      list: grocerProductIds.map((barcode) => ({ id: barcode, quantity: 1, isChecked: false })),
    });
    await this.prompt.confirm("Exit?");
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
        const children = await this.grocyParentProductService.multiselectChildProducts(parent);
        if (children) {
          resolvedItems.push(
            ...children.map((child) => cloneItemForList({ ...item, product_id: child.id }, ""))
          );
        }
      }
    }
    return resolvedItems;
  }
}
