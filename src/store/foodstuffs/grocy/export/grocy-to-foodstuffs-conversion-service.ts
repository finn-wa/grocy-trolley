import { GrocyQuantityUnitIdLookupService } from "@gt/grocy/id-lookup/grocy-quantity-unit-id-lookup-service";
import { GrocyParentProductService } from "@gt/grocy/products/grocy-parent-product-service";
import { GrocyProductService } from "@gt/grocy/products/grocy-product-service";
import { ParentProduct } from "@gt/grocy/products/types";
import { Product } from "@gt/grocy/products/types/Product";
import { GrocyShoppingListService } from "@gt/grocy/shopping-lists/grocy-shopping-list-service";
import { Logger, prettyPrint } from "@gt/utils/logger";
import prompts from "prompts";
import { singleton } from "tsyringe";
import { FoodstuffsCartService } from "../../cart/foodstuffs-cart-service";
import { CartProductRef, toCartProductRef } from "../../cart/foodstuffs-cart.model";
import { FoodstuffsListService, TEMP_LIST_PREFIX } from "../../lists/foodstuffs-list-service";
import { FoodstuffsCartProduct } from "../../models";
import { resultToCartRef } from "../../search/foodstuffs-search-agent";
import { FoodstuffsSearchService } from "../../search/foodstuffs-search-service";

@singleton()
export class GrocyToFoodstuffsConversionService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private readonly grocyProductService: GrocyProductService,
    private readonly grocyParentProductService: GrocyParentProductService,
    private readonly grocyShoppingListService: GrocyShoppingListService,
    private readonly grocyQuantityUnitIds: GrocyQuantityUnitIdLookupService,
    private readonly foodstuffsListService: FoodstuffsListService,
    private readonly foodstuffsCartService: FoodstuffsCartService,
    private readonly foodstuffsSearchService: FoodstuffsSearchService
  ) {}

  async grocyListToFoodstuffsCart() {
    await this.foodstuffsCartService.clearCart();
    // We clean up before and intentionally leave dangling state for debugging
    await this.foodstuffsListService.deleteLists(new RegExp(TEMP_LIST_PREFIX));

    const listItems = await this.grocyShoppingListService.getShoppingListItems();
    const products = await this.grocyProductService.getAllProducts();
    const parentProducts = await this.grocyParentProductService.getParentProducts(products);
    const cartRefs: CartProductRef[] = [];

    for (const item of listItems) {
      this.logger.debug(`Processing shopping list item: ${item.product_id}`);
      const product = products.find((p) => p.id == item.product_id);
      if (!product) {
        throw new Error(`Product with ID ${item.id} not found`);
      }
      this.logger.info(`Found product: ${product.name}`);
      const fsProducts = await this.getFoodstuffsProducts(product, parentProducts);
      const unit = await this.grocyQuantityUnitIds.getRequiredKey(item.qu_id);
      const quantity = unit === "ea" ? item.amount : 1;
      cartRefs.push(...fsProducts.map((product) => ({ ...product, quantity })));
    }
    this.logger.info("Adding products to cart");
    await this.foodstuffsCartService.addProductsToCart(cartRefs);
  }

  private async getFoodstuffsProducts(
    product: Product,
    parentProducts: Record<string, ParentProduct>
  ): Promise<CartProductRef[]> {
    if (product.userfields.isParent) {
      const parent = parentProducts[product.id];
      if (parent.children.length === 0) {
        this.logger.warn(
          `Parent product ${parent.product.id} / ${parent.product.name} does not have children`
        );
        const result = await this.foodstuffsSearchService.searchAndSelectProduct(
          product.name.replace("(Generic)", ""),
          "BOTH"
        );
        if (!result) return [];
        return [resultToCartRef(result)];
      }
      const children = await this.foodstuffsListService.refreshProductPrices(
        parent.children
          .filter((child) => !!child.userfields?.storeMetadata?.PNS)
          .map((child) => child.userfields.storeMetadata?.PNS as FoodstuffsCartProduct)
      );
      if (children.length === 1) {
        return [toCartProductRef(children[0])];
      }
      const choices = children.map((child) => ({
        title: `$${child.price / 100} - ${child.brand} ${child.name} ${child.weightDisplayName}`,
        value: toCartProductRef(child),
      }));
      const choice = await prompts({
        name: "products",
        type: "multiselect",
        choices,
        message: `Select a product for ${parent.product.name}`,
      });
      return choice.products as CartProductRef[];
    }
    const pnsProduct = product.userfields.storeMetadata?.PNS;
    if (!pnsProduct) {
      this.logger.warn("Product does not have PNS metadata, skipping: " + prettyPrint(product));
      return [];
    }
    return [toCartProductRef(pnsProduct)];
  }
}
