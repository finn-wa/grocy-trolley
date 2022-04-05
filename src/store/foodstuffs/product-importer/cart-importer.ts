import { GrocyServices, Product } from "grocy";
import prompts, { prompt } from "prompts";
import { Logger } from "utils/logger";
import { CartProductRef, FoodstuffsBaseProduct, toCartProductRef } from "..";
import { FoodstuffsCart, FoodstuffsCartService } from "../foodstuffs-cart";
import { FoodstuffsCartProduct } from "../foodstuffs.model";
import { FoodstuffsToGrocyConverter } from "./product-converter";

export class FoodstuffsCartImporter {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private readonly converter: FoodstuffsToGrocyConverter,
    private readonly cartService: FoodstuffsCartService,
    private readonly grocy: Pick<
      GrocyServices,
      "productService" | "parentProductService" | "stockService"
    >
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
    const existingProducts = await this.grocy.productService.getProducts();
    const existingProductIds = existingProducts
      .filter((p) => p.userfields?.storeMetadata?.PNS)
      .map((product) => product.userfields.storeMetadata?.PNS?.productId);

    const productsToImport = [...cart.products, ...cart.unavailableProducts].filter(
      (p) => !existingProductIds.includes(p.productId)
    );
    if (productsToImport.length === 0) {
      this.logger.info("All products have already been imported");
      return;
    }
    const parentProducts = Object.values(await this.grocy.parentProductService.getParentProducts());
    let newProducts: { id: string; product: FoodstuffsCartProduct }[] = [];

    for (const product of productsToImport) {
      const parent = await this.grocy.parentProductService.findParent(
        product.name,
        product.categoryName,
        parentProducts
      );
      const payloads = await this.converter.forImport(product, cart.store.storeId, parent);
      this.logger.info(`Importing product ${payloads.product.name}...`);
      const createdProduct = await this.grocy.productService.createProduct(
        payloads.product,
        payloads.quConversions
      );
      newProducts.push({ id: createdProduct.id, product });
    }
    const stock: { value: boolean } = await prompts({
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
    const productsByPnsId = await this.getProductsByFoodstuffsId();
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
        await this.grocy.stockService.stock("add", grocyProduct.id, addStockRequest);
      } catch (error) {
        this.logger.error("Error stocking product ", error);
      }
    }
  }

  async getProductsByFoodstuffsId(): Promise<Record<string, Product>> {
    const existingProducts = await this.grocy.productService.getProducts();
    return Object.fromEntries(
      existingProducts
        .filter((p) => p.userfields?.storeMetadata?.PNS)
        .map((product) => [product.userfields.storeMetadata?.PNS?.productId, product])
    );
  }
}
