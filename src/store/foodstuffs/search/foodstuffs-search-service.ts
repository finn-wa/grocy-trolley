import { uniqueByProperty } from "@gt/utils/arrays";
import { Logger } from "@gt/utils/logger";
import prompts from "prompts";
import { FoodstuffsUserAgent } from "../rest/foodstuffs-user-agent";
import { FoodstuffsSearchAgent } from "./foodstuffs-search-agent";
import { ProductSearchResult, SearchAgentType } from "./foodstuffs-search.model";

/**
 * Search service that supports searching with multiple {@link FoodstuffsSearchAgent}s
 * as well as interactive prompt-based search methods.
 */
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
  ): Promise<ProductSearchResult | null> {
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
  ): Promise<ProductSearchResult[]> {
    return Promise.all(this.agents[agentType].map((agent) => agent.searchProducts(query))).then(
      (results) => uniqueByProperty(results.flat(), "ProductId")
    );
  }

  private async getSearchPromptResponse(
    results: ProductSearchResult[]
  ): Promise<SearchPromptResponse> {
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
}

interface SearchPromptResponse {
  query?: string;
  productChoice?: ProductSearchResult | "searchAgain" | "skip";
}
