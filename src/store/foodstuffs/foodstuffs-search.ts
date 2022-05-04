import { uniqueByProperty } from "@gt/utils/arrays";
import { Logger } from "@gt/utils/logger";
import prompts from "prompts";
import { setTimeout } from "timers/promises";
import { CartProductRef, SaleTypeString } from ".";
import { ListProductRef } from "./foodstuffs-lists";
import { FoodstuffsRestService } from "./rest-service/foodstuffs-rest-service";
import { FoodstuffsUserAgent } from "./user-agent/foodstuffs-user-agent";

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
    const headersBuilder = await this.authHeaders();
    return this.postForJson(
      this.buildUrl("SearchAutoComplete/AutoComplete"),
      headersBuilder.acceptJson().contentTypeJson().build(),
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

  async searchAndSelectProduct(
    query: string,
    agentType: SearchAgentType = "USER"
  ): Promise<ProductResult | null> {
    const agents = (() => {
      if (agentType === "USER") return [this.userAgent];
      if (agentType === "ANON") return [this.anonAgent];
      return [this.userAgent, this.anonAgent];
    })();
    const results = await Promise.all(agents.map((agent) => agent.searchProducts(query))).then(
      (results) => uniqueByProperty(results.flat(), "ProductId")
    );
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
      sale_type: saleType,
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

export type SearchAgentType = "USER" | "ANON" | "BOTH";

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
