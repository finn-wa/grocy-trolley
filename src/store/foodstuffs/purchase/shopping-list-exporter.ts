import { GrocyTrue } from "@grocy-trolley/grocy/grocy-model";
import { GrocyServices, ParentProduct, Product } from "grocy";
import prompts from "prompts";
import { Logger, prettyPrint } from "utils/logger";
import { FoodstuffsServices } from "..";
import { CartProductRef, toCartProductRef } from "../foodstuffs-cart";
import { FoodstuffsCartProduct } from "../foodstuffs.model";

export class GrocyShoppingListExporter {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private readonly grocy: Pick<
      GrocyServices,
      "productService" | "parentProductService" | "shoppingListService"
    >,
    private readonly foodstuffs: Pick<FoodstuffsServices, "listService" | "cartService">
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
      const fsProduct = await this.getFoodstuffsProduct(product, parentProducts);
      if (fsProduct) {
        cartRefs.push(toCartProductRef({ ...fsProduct, quantity: item.amount }));
      }
    }
    this.logger.info("Adding products to cart");
    await this.foodstuffs.cartService.addProductsToCart(cartRefs);
  }

  private async getFoodstuffsProduct(
    product: Product,
    parentProducts: Record<string, ParentProduct>
  ): Promise<FoodstuffsCartProduct | null> {
    if (product.userfields.isParent === GrocyTrue) {
      const parent = parentProducts[product.id];
      if (parent.children.length === 0) {
        this.logger.warn(
          `Parent product ${parent.product.id} / ${parent.product.name} does not have children`
        );
        return null;
      }
      const children = await this.foodstuffs.listService.refreshProductPrices(
        parent.children
          .filter((child) => !!child.userfields?.storeMetadata?.PNS)
          .map((child) => child.userfields.storeMetadata?.PNS as FoodstuffsCartProduct)
      );
      const choices = children.map((child) => ({
        title: `$${child.price / 100} - ${child.brand} ${child.name} ${child.weightDisplayName}`,
        value: child as any,
      }));
      const choice = await prompts([
        {
          name: "product",
          type: "select",
          choices: [{ title: "Skip", value: null as any }, ...choices],
          message: `Select a product for ${parent.product.name}`,
        },
      ]);
      return choice.product;
    }
    const pnsProduct = product.userfields.storeMetadata?.PNS;
    if (!pnsProduct) {
      this.logger.warn("Product does not have PNS metadata, skipping: " + prettyPrint(product));
      return null;
    }
    return pnsProduct;
  }
}
