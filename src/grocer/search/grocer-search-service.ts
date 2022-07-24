import { getEnvVar } from "@gt/utils/environment";
import { Logger } from "@gt/utils/logger";
import { RestService } from "@gt/utils/rest";
import { searchAndSelectResult } from "@gt/utils/search";
import { ProductSearchResponse, ProductSearchResponseHit } from "./types/ProductSearchResponse";
import { getProductSearchResponseSchema } from "./types/ProductSearchResponse/schema";

export class GrocerSearchService extends RestService {
  protected baseUrl = "https://api.grocer.nz";
  protected logger = new Logger(this.constructor.name);
  private readonly authHeader = getEnvVar("GROCER_SEARCH_AUTHORIZATION");

  async search(
    query: string,
    storeIds: number[],
    limit = 20,
    offset = 0
  ): Promise<ProductSearchResponse> {
    const request = {
      attributesToRetrieve: ["id", "name", "brand", "unit", "size"],
      filter: [storeIds.map((id) => `stores = ${id}`)],
      limit,
      offset,
      q: query,
    };
    return this.postAndParse(
      this.buildUrl("/search/indexes/products/search"),
      {
        headers: {
          host: "api.grocer.nz",
          accept: "application/json",
          "accept-language": "en-US,en;q=0.5",
          "accept-encoding": "gzip, deflate, br",
          "content-type": "application/json",
          origin: "https://grocer.nz",
          dnt: "1",
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-site",
          referer: "https://grocer.nz/",
          authorization: this.authHeader,
        },
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
    return searchAndSelectResult(
      (query) => this.search(query, storeIds).then((response) => response.hits),
      (hit) => `${hit.brand} ${hit.name} ${hit.size}${hit.unit}`,
      query
    );
  }
}
