import { Logger } from "@gt/utils/logger";
import { setTimeout } from "timers/promises";
import { CartProductRef } from "../cart/foodstuffs-cart.model";
import { ListProductRef } from "../lists/foodstuffs-list.model";
import { FoodstuffsRestService } from "../rest/foodstuffs-rest-service";
import { FoodstuffsUserAgent } from "../rest/foodstuffs-user-agent";
import { ProductSearchResult, ProductSearchResponse } from "./foodstuffs-search.model";

/**
 * Service that uses a {@link FoodstuffsUserAgent} to interact with the
 * Foodstuffs Search API.
 */
export class FoodstuffsSearchAgent extends FoodstuffsRestService {
  protected readonly logger;
  private readonly timeout = 1000;
  private lastSearchTime = 0;

  constructor(name: string, userAgent: FoodstuffsUserAgent) {
    super(userAgent);
    this.logger = new Logger(name);
  }

  /**
   * Searches Foodstuffs.
   * @param query Search query
   * @returns Search response
   */
  async search(query: string): Promise<ProductSearchResponse> {
    this.logger.info("Searching Foodstuffs: " + query);
    await this.cooldown();
    const headersBuilder = await this.authHeaders();
    return this.postAndParse(this.buildUrl("SearchAutoComplete/AutoComplete"), {
      headers: headersBuilder.acceptJson().contentTypeJson().build(),
      body: JSON.stringify({ SearchTerm: query }),
    });
  }

  /**
   * Searches Foodstuffs products.
   * @param query Search query
   * @returns Search response
   */
  async searchProducts(query: string): Promise<ProductSearchResult[]> {
    const response = await this.search(query);
    return response.productResults;
  }

  private async cooldown(): Promise<void> {
    const elapsed = Date.now() - this.lastSearchTime;
    if (elapsed < this.timeout) {
      await setTimeout(this.timeout - elapsed);
    }
    this.lastSearchTime = Date.now();
  }
}

export function resultToCartRef(product: ProductSearchResult): CartProductRef {
  const saleType = product.SaleType === "BOTH" ? "UNITS" : product.SaleType;
  return {
    productId: product.ProductId.replaceAll("-", "_"),
    restricted: product.Restricted,
    sale_type: saleType,
    quantity: 1,
  };
}

export function resultToListRef(product: ProductSearchResult): ListProductRef {
  return {
    productId: product.ProductId,
    saleType: product.SaleType,
    quantity: 1,
  };
}
