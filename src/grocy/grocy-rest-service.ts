import { buildUrl, getForJson } from "@grocy-trolley/utils/fetch-utils";
import { headers, HeadersBuilder } from "@grocy-trolley/utils/headers-builder";
import { components } from "./api";

type Schemas = components["schemas"];

export abstract class GrocyRestService {
  constructor(protected readonly config: GrocyConnectionConfig) {}

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

export interface GrocyConnectionConfig {
  readonly apiKey: string;
  readonly baseUrl: string;
}
