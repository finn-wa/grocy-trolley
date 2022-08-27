import { getEnvVar } from "@gt/utils/environment";
import { HeadersBuilder } from "@gt/utils/headers";
import { Logger } from "@gt/utils/logger";
import { RestService } from "@gt/utils/rest";
import { SearchUtils } from "@gt/utils/search";
import { Lifecycle, scoped } from "tsyringe";
import { GrocerStoreService } from "../stores/grocer-store-service";
import { ProductSearchResponse, ProductSearchResponseHit } from "./types/ProductSearchResponse";
import { getProductSearchResponseSchema } from "./types/ProductSearchResponse/schema";

@scoped(Lifecycle.ContainerScoped)
export class GrocerSearchService extends RestService {
  protected readonly baseUrl = "https://api.grocer.nz";
  protected readonly logger = new Logger(this.constructor.name);

  private readonly baseHeaders = {
    host: "api.grocer.nz",
    "accept-language": "en-US,en;q=0.5",
    "accept-encoding": "gzip, deflate, br",
    origin: "https://grocer.nz",
    dnt: "1",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
    referer: "https://grocer.nz/",
    authorization: getEnvVar("GROCER_SEARCH_AUTHORIZATION"),
  };

  constructor(
    private readonly storeService: GrocerStoreService,
    private readonly searchUtils: SearchUtils
  ) {
    super();
  }

  async search(
    query: string,
    storeIds?: number[],
    limit = 20,
    offset = 0
  ): Promise<ProductSearchResponse | null> {
    if (!storeIds) {
      const stores =
        (await this.storeService.getCachedStores()) ?? (await this.storeService.promptForStores());
      if (!stores) return null;
      storeIds = stores.map((store) => store.id);
    }
    const request = {
      attributesToRetrieve: ["*"],
      filter: [storeIds.map((id) => `stores = ${id}`)],
      limit,
      offset,
      q: query,
    };
    return this.postAndParse(
      this.buildUrl("/search/indexes/products/search"),
      {
        headers: new HeadersBuilder(this.baseHeaders).contentTypeJson().acceptJson().build(),
        body: JSON.stringify(request),
      },
      getProductSearchResponseSchema()
    );
  }

  /**
   * Search for and select a product using prompts.
   * @param query Initial query (user can choose to modify after initial search)
   * @param storeIds IDs of stores to search
   * @returns The selected product, or null if no product was selected
   */
  async searchAndSelectProduct(
    query: string,
    storeIds: number[]
  ): Promise<ProductSearchResponseHit | null> {
    return this.searchUtils.searchAndSelectResult(
      (query) => this.search(query, storeIds).then((response) => (response ? response.hits : [])),
      (hit) => `${hit.brand} ${hit.name} ${hit.size}${hit.unit}`,
      query
    );
  }
}
