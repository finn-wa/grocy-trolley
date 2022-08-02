import { FoodstuffsTokens } from "@gt/injection-tokens";
import { uniqueByProperty } from "@gt/utils/arrays";
import { Logger } from "@gt/utils/logger";
import { searchAndSelectResult } from "@gt/utils/search";
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
    const anonAgent = new FoodstuffsSearchAgent("FoodstuffsAnonSearchAgent", userAgent.clone());
    this.agents = {
      USER: [userSearchAgent],
      ANON: [anonAgent],
      BOTH: [userSearchAgent, anonAgent],
    };
  }
  static readonly inject = [FoodstuffsTokens.userAgent] as const;

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
    return searchAndSelectResult(
      (query) => this.searchWithAgentType(query, agentType),
      (r) => `${r.ProductBrand} ${r.ProductName} ${r.ProductWeightDisplayName}`,
      query
    );
  }

  private async searchWithAgentType(
    query: string,
    agentType: SearchAgentType
  ): Promise<ProductSearchResult[]> {
    return Promise.all(this.agents[agentType].map((agent) => agent.searchProducts(query))).then(
      (results) => uniqueByProperty(results.flat(), "ProductId")
    );
  }
}
