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
  private readonly agents: Readonly<Record<SearchAgentType, FoodstuffsSearchAgent[]>>;

  /**
   * Creates a new FoodstuffSearchService.
   * @param userAgent Authenticated user agent
   */
  constructor(userAgent: FoodstuffsUserAgent) {
    const userSearchAgent = new FoodstuffsSearchAgent("FoodstuffsUserSearchAgent", userAgent);
    const anonAgent = new FoodstuffsSearchAgent("FoodstuffsAnonSearchAgent", userAgent.clone(null));
    this.agents = {
      USER: [userSearchAgent],
      ANON: [anonAgent],
      BOTH: [userSearchAgent, anonAgent],
    };
  }

  /**
   * Search for and select a product using prompts.
   * @param query Initial query (user can choose to modify after initial search)
   * @param agentType Agent type to use for the search
   * @returns The selected product, or null if no product was selected
   */
  async searchAndSelectProduct(
    query: string,
    agentType: SearchAgentType = "USER"
  ): Promise<ProductResult | null> {
    for (let nextQuery: string | undefined = query; nextQuery; ) {
      const results = await this.searchWithAgentType(query, agentType);
      const response = await this.getSearchPromptResponse(results);
      if (response.productChoice === "skip") {
        return null;
      }
      if (response.productChoice && response.productChoice !== "searchAgain") {
        return response.productChoice;
      }
      nextQuery = response.query;
    }
    return null;
  }

  private async searchWithAgentType(
    query: string,
    agentType: SearchAgentType
  ): Promise<ProductResult[]> {
    return Promise.all(this.agents[agentType].map((agent) => agent.searchProducts(query))).then(
      (results) => uniqueByProperty(results.flat(), "ProductId")
    );
  }

  private async getSearchPromptResponse(results: ProductResult[]): Promise<SearchPromptResponse> {
    if (results.length === 0) {
      console.log("No results found.");
      return prompts([
        {
          message: "Enter a new search query",
          name: "query",
          type: "text",
        },
      ]);
    }
    return prompts([
      {
        message: "Select a product",
        name: "product",
        type: "select",
        choices: [
          ...results.map((r) => ({
            title: `${r.ProductBrand} ${r.ProductName} ${r.ProductWeightDisplayName}`,
            value: r,
          })),
          { title: "Modify search query", value: "searchAgain" },
          { title: "Skip", value: "skip" },
        ],
      },
      {
        message: "Enter a new search query",
        name: "query",
        type: (prev) => (prev === "searchAgain" ? "text" : null),
      },
    ]);
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

interface SearchPromptResponse {
  query?: string;
  productChoice?: ProductResult | "searchAgain" | "skip";
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
