import { GrocyProductService } from "@grocy-trolley/grocy";
import {
  GrocyShoppingListService,
  ShoppingListItem,
} from "@grocy-trolley/grocy/grocy-shopping-lists";
import { Logger, prettyPrint } from "@grocy-trolley/utils/logger";
import prompts from "prompts";
import { CartProductRef, FoodstuffsCartService } from "../foodstuffs-cart";
import { FoodstuffsCartProduct } from "../foodstuffs.model";

export class ShoppingListToCart {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private readonly productService: GrocyProductService,
    private readonly shoppingListService: GrocyShoppingListService,
    private readonly foodstuffsCartService: FoodstuffsCartService
  ) {}
  async go() {
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
      this.logger.debug(`Found product: ${product.name}`);
      let cartProduct: FoodstuffsCartProduct;
      if (product.userfields.isParent) {
        const parent = parentProducts[product.id];
        const choice = await prompts([
          {
            name: "product",
            type: "select",
            choices: parent.children.map((child) => ({ title: child.name, value: child as any })),
            message: `Select a product for ${parent.product.name}`,
          },
        ]);
        cartProduct = choice.product;
      } else {
        const pnsProduct = product.userfields.storeMetadata?.PNS;
        if (!pnsProduct) {
          this.logger.warn("Product does not have PNS metadata, skipping: " + prettyPrint(product));
          continue;
        }
        cartProduct = pnsProduct;
      }
      cartRefs.push({
        productId: cartProduct.productId,
        quantity: item.amount,
        restricted: cartProduct.restricted,
        sale_type: cartProduct.sale_type,
      });
    }
    this.logger.info("Adding products to cart");
    await this.foodstuffsCartService.addProductsToCart(cartRefs);
  }
}
