import { uniqueByProperty } from "utils/arrays";
import prompts from "prompts";
import { setTimeout } from "timers/promises";
import { headers } from "utils/headers-builder";
import { Logger } from "utils/logger";
import { CartProductRef, SaleTypeString } from ".";
import { ListProductRef } from "./foodstuffs-lists";
import { FoodstuffsRestService } from "./foodstuffs-rest-service";
import { FoodstuffsUserAgent } from "./foodstuffs-user-agent";

class FoodstuffsSearchAgent extends FoodstuffsRestService {
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
    const headersBuilder = headers().acceptJson().contentTypeJson();
    return this.postForJson(
      this.buildUrl("SearchAutoComplete/AutoComplete"),
      headersBuilder.build(),
      { SearchTerm: query }
    );
  }

  /**
   * Searches Foodstuffs products.
   * @param query Search query
   * @returns Search response
   */
  async searchProducts(query: string): Promise<ProductResult[]> {
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

export class FoodstuffsSearchService {
  protected readonly logger = new Logger(this.constructor.name);
  private readonly userAgent: FoodstuffsSearchAgent;
  private readonly anonAgent: FoodstuffsSearchAgent;

  /**
   * Creates a new FoodstuffSearchService.
   * @param userAgent Authenticated user agent
   */
  constructor(userAgent: FoodstuffsUserAgent) {
    this.userAgent = new FoodstuffsSearchAgent("FoodstuffsUserSearchAgent", userAgent);
    this.anonAgent = new FoodstuffsSearchAgent("FoodstuffsAnonSearchAgent", userAgent.clone(null));
  }

  // TODO: add single search methods for with/without credentials and use searchWithCredentials from shop

  async searchAndSelectProduct(query: string): Promise<ProductResult | null> {
    const results = await Promise.all(
      [this.userAgent, this.anonAgent].map((agent) => agent.searchProducts(query))
    ).then((results) => uniqueByProperty(results.flat(), "ProductId"));
    if (results.length === 0) {
      return null;
    }
    if (results.length === 1) {
      const product = results[0];
      this.logger.info(`Found product ${product.ProductId}: ${product.ProductName}`);
      return product;
    }
    const choice = await prompts([
      {
        message: "Select a product",
        name: "value",
        type: "select",
        choices: [
          { title: "Skip", value: null as any },
          ...results.map((r) => ({
            title: `${r.ProductBrand} ${r.ProductName} ${r.ProductWeightDisplayName}`,
            value: r,
          })),
        ],
      },
    ]);
    return choice.value;
  }

  resultToCartRef(product: ProductResult): CartProductRef {
    const saleType = product.SaleType === "BOTH" ? "UNITS" : product.SaleType;
    return {
      productId: product.ProductId.replaceAll("-", "_"),
      restricted: product.Restricted,
      sale_type: product.SaleType,
      quantity: 1,
    };
  }

  resultToListRef(product: ProductResult): ListProductRef {
    return {
      productId: product.ProductId,
      saleType: product.SaleType,
      quantity: 1,
    };
  }
}

export interface ProductResult {
  ProductName: string;
  ProductThumbnailUrl: string;
  ProductUrl: string;
  ProductWeightDisplayName: string;
  ProductBrand: string;
  ProductId: string;
  SaleType: SaleTypeString;
  ProductVariants: string;
  Restricted: boolean;
  Tobacco: boolean;
  RangedOnline: boolean;
  RangedInStore: boolean;
}

/** TODO: get model */
export type ProductCategoryResults = unknown;

export interface ProductSearchResponse {
  productCategoryResults: ProductCategoryResults[];
  productResults: ProductResult[];
  UserDataSearchMessage: string;
  Success: boolean;
}
