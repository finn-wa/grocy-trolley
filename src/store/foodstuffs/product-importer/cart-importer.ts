import { GrocyProductService } from "@grocy-trolley/grocy";
import { GrocyStockService } from "@grocy-trolley/grocy/grocy-stock";
import { Logger } from "@grocy-trolley/utils/logger";
import { prompt } from "prompts";
import { CartProductRef, FoodstuffsBaseProduct, FoodstuffsCartProduct, toCartProductRef } from "..";
import { FoodstuffsCart, FoodstuffsCartService } from "../foodstuffs-cart";
import { FoodstuffsToGrocyConverter } from "./product-converter";

export class FoodstuffsCartImporter {
  private readonly logger = new Logger("FoodstuffsCartImporter");

  constructor(
    private readonly converter: FoodstuffsToGrocyConverter,
    private readonly cartService: FoodstuffsCartService,
    private readonly grocyProductService: GrocyProductService,
    private readonly grocyStockService: GrocyStockService
  ) {}

  async importProducts(products: FoodstuffsBaseProduct[]) {
    const productRefs = products.map((product) => toCartProductRef(product));
    return this.importProductRefs(productRefs);
  }

  async importProductRefs(productRefs: CartProductRef[]) {
    await this.cartService.clearCart();
    const cart = await this.cartService.addProductsToCart(productRefs);
    await this.importProductsFromCart(cart);
  }

  async importProductsFromCart(cart?: FoodstuffsCart): Promise<void> {
    if (!cart) {
      cart = await this.cartService.getCart();
    }
    const existingProducts = await this.grocyProductService.getProductsWithParsedUserfields();
    const existingProductIds = existingProducts
      .filter((p) => p.userfields?.storeMetadata?.PNS)
      .map((product) => product.userfields.storeMetadata?.PNS?.productId);

    const productsToImport = [...cart.products, ...cart.unavailableProducts].filter(
      (p) => !existingProductIds.includes(p.productId)
    );
    const parentProducts = Object.values(await this.grocyProductService.getParentProducts());
    let newProducts: { id: string; product: FoodstuffsCartProduct }[] = [];

    for (const product of productsToImport) {
      const grocyProduct = await this.converter.forImport(
        product,
        cart.store.storeId,
        parentProducts
      );
      this.logger.info(`Importing product ${grocyProduct.name}...`);
      const createdProduct = await this.grocyProductService.createProduct(grocyProduct);
      newProducts.push({ id: createdProduct.objectId, product });
    }
    const stock: { value: boolean } = await prompt({
      name: "value",
      message: "Stock imported products?",
      type: "confirm",
    });
    if (stock.value) {
      await this.stockProductsFromCart(cart);
    }
  }

  async stockProductsFromCart(cart?: FoodstuffsCart) {
    if (!cart) {
      cart = await this.cartService.getCart();
    }
    const productsByPnsId = await this.grocyProductService.getProductsByFoodstuffsId();
    // Not including unavailable products for stock
    for (const product of cart.products) {
      const grocyProduct = productsByPnsId[product.productId];
      if (!grocyProduct) {
        this.logger.error(
          `Product ${product.productId} (${product.name}) does not exist in Grocy, skipping`
        );
        continue;
      }
      this.logger.info("Stocking product: " + grocyProduct.name);
      try {
        const addStockRequest = this.converter.forAddStock(grocyProduct, cart.store.storeId);
        await this.grocyStockService.stock("add", grocyProduct.id, addStockRequest);
      } catch (error) {
        this.logger.error("Error stocking product ", error);
      }
    }
  }
}
