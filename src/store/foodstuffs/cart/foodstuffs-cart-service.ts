import { Logger, prettyPrint } from "@gt/utils/logger";
import prompts from "prompts";
import { FoodstuffsRestService } from "../rest/foodstuffs-rest-service";
import { FoodstuffsUserAgent } from "../rest/foodstuffs-user-agent";
import { CartProductRef, FoodstuffsCart } from "./foodstuffs-cart.model";

export class FoodstuffsCartService extends FoodstuffsRestService {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(userAgent: FoodstuffsUserAgent) {
    super(userAgent);
  }

  async getCart(): Promise<FoodstuffsCart> {
    const headersBuilder = await this.authHeaders();
    return this.getAndParse(this.buildUrl("Cart/Index"), {
      headers: headersBuilder.acceptJson().build(),
    });
  }

  async clearCart(): Promise<{ success: true }> {
    const headersBuilder = await this.authHeaders();
    const response = await this.deleteAndParse<{ success: boolean }>(this.buildUrl("Cart/Clear"), {
      headers: headersBuilder.acceptJson().build(),
    });
    if (!response.success) {
      throw new Error(`Failed to clear cart: ${prettyPrint(response)}`);
    }
    return response as { success: true };
  }

  async addProductsToCart(products: CartProductRef[]): Promise<FoodstuffsCart> {
    try {
      const cart = await this.postProducts(products);
      return cart;
    } catch (error) {
      this.logger.error(error);
      this.logger.error("Failed to add products to cart. Falling back to chunks.");
    }
    const iter = products[Symbol.iterator]();
    let chunk: CartProductRef[];
    do {
      chunk = Array.from(
        { length: 5 },
        () => iter.next().value as CartProductRef | undefined
      ).filter((p): p is CartProductRef => !!p);
      try {
        await this.postProducts(chunk);
      } catch (error) {
        await this.addProductsToCartIndividually(chunk);
      }
    } while (chunk.length === 5);
    return this.getCart();
  }

  private async addProductsToCartIndividually(products: CartProductRef[]): Promise<FoodstuffsCart> {
    for (const product of products) {
      this.logger.debug("Adding product " + product.productId);
      try {
        await this.postProducts([product]);
      } catch (error) {
        this.logger.error("Failed to add product to cart!\n" + prettyPrint(product));
        this.logger.error(error);
        const response = await prompts([
          { name: "resume", type: "confirm", message: "Resume adding products?" },
        ]);
        if (!response.resume) {
          throw error;
        }
      }
    }
    return this.getCart();
  }

  private async postProducts(products: CartProductRef[]): Promise<FoodstuffsCart> {
    const headersBuilder = await this.authHeaders();
    return this.postAndParse(this.buildUrl("Cart/Index"), {
      headers: headersBuilder.contentTypeJson().acceptJson().build(),
      body: JSON.stringify({ products }),
    });
  }
}
