import { Logger, prettyPrint } from "@gt/utils/logger";
import { FoodstuffsRestService } from "../rest/foodstuffs-rest-service";
import { CartProductRef, FoodstuffsCart } from "./foodstuffs-cart.model";

/**
 * Contains REST methods for /CommonApi/Cart endpoints. FoodstuffsCartService
 * contains logic for interacting with these endpoints.
 */
export class FoodstuffsCartController extends FoodstuffsRestService {
  protected readonly logger = new Logger(this.constructor.name);

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

  async postProducts(products: CartProductRef[]): Promise<FoodstuffsCart> {
    const headersBuilder = await this.authHeaders();
    return this.postAndParse(this.buildUrl("Cart/Index"), {
      headers: headersBuilder.contentTypeJson().acceptJson().build(),
      body: JSON.stringify({ products }),
    });
  }
}
