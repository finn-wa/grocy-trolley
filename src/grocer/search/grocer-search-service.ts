import { getEnvVar } from "@gt/utils/environment";
import { Logger } from "@gt/utils/logger";
import { RestService } from "@gt/utils/rest";
import { getProductSearchResponseSchema } from "./types/ProductSearchResponse/schema";

export class GrocerSearchService extends RestService {
  protected baseUrl = "https://search.grocer.nz";
  protected logger = new Logger(this.constructor.name);
  private readonly authHeader = getEnvVar("GROCER_SEARCH_AUTHORIZATION");

  async search(query: string, storeIds: number[], limit = 20, offset = 0) {
    const request = {
      attributesToRetrieve: ["id", "name", "brand", "unit", "size"],
      filter: [storeIds.map((id) => `stores = ${id}`)],
      limit,
      offset,
      q: query,
    };
    return this.fetchAndParse(
      this.buildUrl("/indexes/products/search"),
      {
        method: "POST",
        headers: {
          host: "search.grocer.nz",
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
}
