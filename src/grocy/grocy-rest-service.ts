import { getEnv } from "@grocy-trolley/env";
import { headers, HeadersBuilder } from "@grocy-trolley/utils/headers-builder";
import { RestService } from "@grocy-trolley/utils/rest";
import { components } from "./api";

type Schemas = components["schemas"];

export abstract class GrocyRestService extends RestService {
  private readonly env = getEnv();
  private readonly apiKey = this.env.GROCY_API_KEY;
  readonly baseUrl = this.env.GROCY_URL;

  protected authHeaders(): HeadersBuilder {
    return headers().append("GROCY-API-KEY", this.apiKey);
  }

  protected async getEntities<K extends keyof Schemas>(
    entity: Schemas["ExposedEntity"]
  ): Promise<Schemas[K][]> {
    return this.getForJson(
      this.buildUrl("objects/" + entity),
      this.authHeaders().acceptJson().build()
    );
  }
}
