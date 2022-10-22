import { AppTokens } from "@gt/app/di";
import { GrocyParentProductService } from "@gt/grocy/products/grocy-parent-product-service";
import { GrocyProductService } from "@gt/grocy/products/grocy-product-service";
import { Product } from "@gt/grocy/products/types/Product";
import { GrocyStockService } from "@gt/grocy/stock/grocy-stock-service";
import { PromptProvider } from "@gt/prompts/prompt-provider";
import { Logger } from "@gt/utils/logger";
import { RequestError } from "@gt/utils/rest";
import { inject, Lifecycle, scoped } from "tsyringe";
import { FoodstuffsCartService } from "../../cart/foodstuffs-cart-service";
import { CartProductRef, FoodstuffsCart, toCartProductRef } from "../../cart/foodstuffs-cart.model";
import { FoodstuffsBaseProduct, FoodstuffsCartProduct } from "../../models";
import { FoodstuffsToGrocyConverter } from "./product-converter";

@scoped(Lifecycle.ContainerScoped)
export class FoodstuffsCartImporter {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private readonly converter: FoodstuffsToGrocyConverter,
    private readonly cartService: FoodstuffsCartService,
    private readonly grocyProductService: GrocyProductService,
    private readonly grocyParentProductService: GrocyParentProductService,
    private readonly grocyStockService: GrocyStockService,
    @inject("PromptProvider") private readonly prompt: PromptProvider
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
    if (!cart.store) {
      throw new Error("Please select a store");
    }
    const existingProducts = await this.grocyProductService.getAllProducts();
    const existingProductIds = existingProducts
      .filter((p) => p.userfields?.storeMetadata?.PNS)
      .map((product) => product.userfields.storeMetadata?.PNS?.productId);

    const productsToImport = [...cart.products, ...cart.unavailableProducts].filter(
      (p) => !existingProductIds.includes(p.productId)
    );
    if (productsToImport.length === 0) {
      this.logger.info("All products have already been imported");
    }
    const parentProducts = Object.values(await this.grocyParentProductService.getParentProducts());
    const newProducts: { id: string; product: FoodstuffsCartProduct }[] = [];

    for (const product of productsToImport) {
      const parent = await this.grocyParentProductService.promptForMatchingParent(
        product.name,
        product.categoryName,
        parentProducts
      );
      const payloads = await this.converter.forImport(product, cart.store.storeId, parent);
      this.logger.info(`Importing product ${payloads.product.name}...`);
      const createdProduct = await this.grocyProductService.createProduct(
        payloads.product,
        payloads.quConversions
      );
      newProducts.push({ id: createdProduct.id, product });
    }
    const stock = await this.prompt.confirm("Stock imported products?");
    if (stock) {
      await this.stockProductsFromCart(cart);
    }
  }

  async stockProductsFromCart(cart?: FoodstuffsCart) {
    if (!cart) {
      cart = await this.cartService.getCart();
    }
    if (!cart.store) {
      throw new Error("Please select a store");
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
        const addStockRequest = await this.converter.forAddStock(grocyProduct, cart.store.storeId);
        await this.grocyStockService.addStock(grocyProduct.id, addStockRequest);
      } catch (error) {
        this.logger.error("Error stocking product");
        if (error instanceof RequestError) {
          this.logger.error(await error.response.text());
        } else {
          this.logger.error(error);
        }
      }
    }
  }

  async getProductsByFoodstuffsId(): Promise<Record<string, Product>> {
    const existingProducts = await this.grocyProductService.getAllProducts();
    return Object.fromEntries(
      existingProducts
        .filter((p) => p.userfields?.storeMetadata?.PNS)
        .map((product) => [product.userfields.storeMetadata?.PNS?.productId, product])
    ) as Record<string, Product>;
  }
}
