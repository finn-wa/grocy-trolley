import { GrocyTrue } from "@grocy-trolley/grocy/grocy-model";
import { GrocyProductService, ParentProduct, SerializedProduct } from "grocy";
import { GrocyShoppingListService } from "grocy/grocy-shopping-lists";
import prompts from "prompts";
import { Logger, prettyPrint } from "utils/logger";
import { CartProductRef, FoodstuffsCartService, toCartProductRef } from "../foodstuffs-cart";
import { FoodstuffsCartProduct } from "../foodstuffs.model";

export class GrocyShoppingListExporter {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private readonly productService: GrocyProductService,
    private readonly shoppingListService: GrocyShoppingListService,
    private readonly foodstuffsCartService: FoodstuffsCartService
  ) {}

  async addShoppingListToCart() {
    await this.foodstuffsCartService.clearCart();
    const listItems = await this.shoppingListService.getShoppingListItems();
    const products = await this.productService.getProductsWithParsedUserfields();
    const parentProducts = await this.productService.getParentProducts(products);
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
    await this.foodstuffsCartService.addProductsToCart(cartRefs);
  }

  private async getFoodstuffsProduct(
    product: SerializedProduct,
    parentProducts: Record<string, ParentProduct>
  ): Promise<FoodstuffsCartProduct | null> {
    if (product.userfields.isParent === GrocyTrue) {
      const parent = parentProducts[product.id];
      if (parent.children.length > 0) {
        this.logger.warn(
          `Parent product ${parent.product.id} / ${parent.product.name} does not have children`
        );
        return null;
      }
      const choice = await prompts([
        {
          name: "product",
          type: "select",
          choices: [
            { title: "Skip", value: null as any },
            ...parent.children.map((child) => ({ title: child.name, value: child as any })),
          ],
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
