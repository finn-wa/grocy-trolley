import { Logger, prettyPrint } from "@gt/utils/logger";
import { singleton } from "tsyringe";
import { FoodstuffsRestService } from "../rest/foodstuffs-rest-service";
import { FoodstuffsAuthHeaderProvider } from "../rest/foodstuffs-auth-header-provider";
import { CartProductRef, FoodstuffsCart } from "./foodstuffs-cart.model";
import { getCartSchema } from "./types/Cart/schema";
import { ClearCartResponse } from "./types/ClearCartResponse";
import { getClearCartResponseSchema } from "./types/ClearCartResponse/schema";

/**
 * Contains REST methods for /CommonApi/Cart endpoints. FoodstuffsCartService
 * contains logic for interacting with these endpoints.
 */
@singleton()
export class FoodstuffsCartController extends FoodstuffsRestService {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(userAgent: FoodstuffsAuthHeaderProvider) {
    super(userAgent);
  }

  async getCart(): Promise<FoodstuffsCart> {
    const headersBuilder = await this.authHeaders();
    return this.getAndParse(
      this.buildUrl("/Cart/Index"),
      { headers: headersBuilder.acceptJson().build() },
      getCartSchema()
    );
  }

  async clearCart(): Promise<ClearCartResponse> {
    const headersBuilder = await this.authHeaders();
    const response = await this.deleteAndParse(
      this.buildUrl("/Cart/Clear"),
      { headers: headersBuilder.acceptJson().build() },
      getClearCartResponseSchema()
    );
    if (!response.success) {
      throw new Error(`Failed to clear cart: ${prettyPrint(response)}`);
    }
    return response;
  }

  async postProducts(products: CartProductRef[]): Promise<FoodstuffsCart> {
    const headersBuilder = await this.authHeaders();
    return this.postAndParse(
      this.buildUrl("/Cart/Index"),
      {
        headers: headersBuilder.contentTypeJson().acceptJson().build(),
        body: JSON.stringify({ products }),
      },
      getCartSchema()
    );
  }
}
