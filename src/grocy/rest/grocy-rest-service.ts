import { getEnv } from "@gt/utils/environment";
import { headersBuilder, HeadersBuilder } from "@gt/utils/headers";
import { RestService } from "@gt/utils/rest";

export abstract class GrocyRestService extends RestService {
  private readonly env = getEnv();
  private readonly apiKey = this.env.GROCY_API_KEY;
  protected readonly baseUrl = this.validateBaseUrl(this.env.GROCY_URL);

  protected authHeaders(): HeadersBuilder {
    return headersBuilder().append("GROCY-API-KEY", this.apiKey);
  }
}
