import { AppTokens } from "@gt/app/di";
import { uniqueByProperty } from "@gt/utils/arrays";
import { Logger } from "@gt/utils/logger";
import { SearchUtils } from "@gt/utils/search";
import { Browser } from "playwright";
import { inject, Lifecycle, scoped } from "tsyringe";
import { FoodstuffsAuthHeaderProvider } from "../rest/foodstuffs-auth-header-provider";
import { FoodstuffsSearchAgent } from "./foodstuffs-search-agent";
import { ProductSearchResult, SearchAgentType } from "./foodstuffs-search.model";

/**
 * Search service that supports searching with multiple {@link FoodstuffsSearchAgent}s
 * as well as interactive prompt-based search methods.
 */
@scoped(Lifecycle.ContainerScoped)
export class FoodstuffsSearchService {
  protected readonly logger = new Logger(this.constructor.name);
  private readonly agents: Readonly<Record<SearchAgentType, FoodstuffsSearchAgent[]>>;

  constructor(
    private readonly searchUtils: SearchUtils,
    authHeaderProvider: FoodstuffsAuthHeaderProvider,
    @inject(AppTokens.browserLoader) browserLoader: () => Promise<Browser>
  ) {
    const userSearchAgent = new FoodstuffsSearchAgent(
      "FoodstuffsUserSearchAgent",
      authHeaderProvider
    );
    const anonSearchAgent = new FoodstuffsSearchAgent(
      "FoodstuffsAnonSearchAgent",
      new FoodstuffsAuthHeaderProvider(browserLoader)
    );
    this.agents = {
      USER: [userSearchAgent],
      ANON: [anonSearchAgent],
      BOTH: [userSearchAgent, anonSearchAgent],
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
    return this.searchUtils.searchAndSelectResult(
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
