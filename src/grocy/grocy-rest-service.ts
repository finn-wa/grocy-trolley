import { buildUrl, getForJson } from "@grocy-trolley/utils/rest";
import { headers, HeadersBuilder } from "@grocy-trolley/utils/headers-builder";
import { components } from "./api";
import { env } from "@grocy-trolley/env";

type Schemas = components["schemas"];

export abstract class GrocyRestService {
  protected readonly config = {
    apiKey: env().GROCY_API_KEY,
    baseUrl: env().GROCY_URL,
  };

  protected authHeaders(): HeadersBuilder {
    return headers().append("GROCY-API-KEY", this.config.apiKey);
  }

  protected buildUrl(path: string, params?: Record<string, string>): string {
    return buildUrl(this.config.baseUrl, path, params);
  }

  protected async getEntities<K extends keyof Schemas>(
    entity: Schemas["ExposedEntity"]
  ): Promise<Schemas[K][]> {
    return getForJson(
      buildUrl(this.config.baseUrl, "objects/" + entity),
      this.authHeaders().acceptJson().build()
    );
  }
}
