import { getEnv, getEnvVar } from "@gt/utils/environment";
import { headersBuilder, HeadersBuilder } from "@gt/utils/headers";
import { RestService } from "@gt/utils/rest";

export abstract class GrocyRestService extends RestService {
  private readonly apiKey = getEnvVar("GROCY_API_KEY");
  protected readonly baseUrl = this.validateBaseUrl(getEnvVar("GROCY_URL"));

  protected authHeaders(): HeadersBuilder {
    return headersBuilder().append("GROCY-API-KEY", this.apiKey);
  }
}
