import { RestService } from "@gt/utils/rest";
import { FoodstuffsUserAgent } from ".";
import { PAKNSAVE_URL } from "./foodstuffs.model";

export abstract class FoodstuffsRestService extends RestService {
  protected readonly baseUrl = this.validateBaseUrl(PAKNSAVE_URL + "CommonApi/");

  constructor(protected readonly userAgent: FoodstuffsUserAgent) {
    super();
  }

  /**
   * Overrides the base {@link RestService.fetchWithMethod} to use the
   * FoodstuffsUserAgent to perform requests.
   */
  protected async fetchWithMethod(
    method: string,
    url: string,
    headers?: Headers,
    body?: any
  ): Promise<Response> {
    return this.userAgent.fetchWithBrowser(method, url, headers, body);
  }
}
