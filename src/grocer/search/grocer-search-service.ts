import { getEnvVar } from "@gt/utils/environment";
import { Logger } from "@gt/utils/logger";
import { ifPrevEquals } from "@gt/utils/prompts";
import { RestService } from "@gt/utils/rest";
import prompts from "prompts";
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
    for (let nextQuery = query; nextQuery && nextQuery.length > 0; ) {
      const results = await this.search(nextQuery, storeIds);
      const actionResponse = await this.promptForNextAction(results);
      switch (actionResponse.action) {
        case "select":
          return actionResponse.hit;
        case "searchAgain": {
          nextQuery = actionResponse.query;
          continue;
        }
        case "skip":
        default:
          return null;
      }
    }
    return null;
  }

  private async promptForNextAction(
    response: ProductSearchResponse
  ): Promise<SearchAndSelectAction> {
    const hits = response.hits;
    if (hits.length === 1) {
      return { action: "select", hit: hits[0] };
    }
    if (hits.length === 0) {
      console.log("No results found.");
    }
    const nextActionResponse = await prompts([
      {
        message: "Select a product",
        name: "nextAction",
        type: "select",
        choices: [
          ...hits.map((hit) => ({
            title: `${hit.brand} ${hit.name} ${hit.size}${hit.unit}`,
            value: { action: "select", hit },
          })),
          { title: "Modify search query", value: { action: "searchAgain" } },
          { title: "Skip", value: { action: "skip" } },
        ],
      },
      {
        type: ifPrevEquals("searchAgain", "text"),
        message: "Enter a new search query, or leave blank to skip",
        name: "query",
        initial: response.query,
      },
    ]);
    const nextAction = nextActionResponse.nextAction as SearchAndSelectAction;
    if (nextActionResponse.query && nextAction.action === "searchAgain") {
      return { action: "searchAgain", query: nextActionResponse.query as string };
    }
    return nextAction;
  }
}

interface SearchAgainAction {
  readonly action: "searchAgain";
  readonly query: string;
}

interface SkipAction {
  readonly action: "skip";
}

interface SelectHitAction {
  readonly action: "select";
  readonly hit: ProductSearchResponseHit;
}

type SearchAndSelectAction = SearchAgainAction | SkipAction | SelectHitAction;
