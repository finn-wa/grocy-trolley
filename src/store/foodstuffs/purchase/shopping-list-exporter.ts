import { GrocyServices, ParentProduct, Product } from "grocy";
import { GrocyTrue } from "grocy/grocy-model";
import prompts from "prompts";
import { Logger, prettyPrint } from "utils/logger";
import { FoodstuffsServices } from "..";
import { CartProductRef, toCartProductRef } from "../cart/foodstuffs-cart";
import { FoodstuffsCartProduct } from "../foodstuffs.model";

export class GrocyShoppingListExporter {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private readonly grocy: Pick<
      GrocyServices,
      "productService" | "parentProductService" | "shoppingListService" | "idMaps"
    >,
    private readonly foodstuffs: Pick<
      FoodstuffsServices,
      "listService" | "cartService" | "searchService"
    >
  ) {}

  async addShoppingListToCart() {
    await this.foodstuffs.cartService.clearCart();
    await this.foodstuffs.listService.deleteTemporaryLists();

    const listItems = await this.grocy.shoppingListService.getShoppingListItems();
    const products = await this.grocy.productService.getProducts();
    const parentProducts = await this.grocy.parentProductService.getParentProducts(products);
    const cartRefs: CartProductRef[] = [];

    for (const item of listItems) {
      this.logger.debug(`Processing shopping list item: ${item.product_id}`);
      const product = products.find((p) => p.id === item.product_id);
      if (!product) {
        throw new Error(`Product with ID ${item.id} not found`);
      }
      this.logger.info(`Found product: ${product.name}`);
      const fsProducts = await this.getFoodstuffsProducts(product, parentProducts);
      const unit = this.grocy.idMaps.quantityUnitNames[item.qu_id as number];
      const quantity = unit === "ea" ? item.amount : 1;
      cartRefs.push(...fsProducts.map((product) => ({ ...product, quantity })));
    }
    this.logger.info("Adding products to cart");
    await this.foodstuffs.cartService.addProductsToCart(cartRefs);
  }

  private async getFoodstuffsProducts(
    product: Product,
    parentProducts: Record<string, ParentProduct>
  ): Promise<CartProductRef[]> {
    if (product.userfields.isParent === GrocyTrue) {
      const parent = parentProducts[product.id];
      if (parent.children.length === 0) {
        this.logger.warn(
          `Parent product ${parent.product.id} / ${parent.product.name} does not have children`
        );
        const result = await this.foodstuffs.searchService.searchAndSelectProduct(
          product.name.replace("(Generic)", "")
        );
        if (!result) return [];
        return [this.foodstuffs.searchService.resultToCartRef(result)];
      }
      const children = await this.foodstuffs.listService.refreshProductPrices(
        parent.children
          .filter((child) => !!child.userfields?.storeMetadata?.PNS)
          .map((child) => child.userfields.storeMetadata?.PNS as FoodstuffsCartProduct)
      );
      if (children.length === 1) {
        return [toCartProductRef(children[0])];
      }
      const choices = children.map((child) => ({
        title: `$${child.price / 100} - ${child.brand} ${child.name} ${child.weightDisplayName}`,
        value: toCartProductRef(child) as any,
      }));
      const choice = await prompts([
        {
          name: "products",
          type: "multiselect",
          choices,
          message: `Select a product for ${parent.product.name}`,
        },
      ]);
      return choice.products;
    }
    const pnsProduct = product.userfields.storeMetadata?.PNS;
    if (!pnsProduct) {
      this.logger.warn("Product does not have PNS metadata, skipping: " + prettyPrint(product));
      return [];
    }
    return [toCartProductRef(pnsProduct)];
  }
}
