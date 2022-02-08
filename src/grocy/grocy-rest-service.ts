import { buildUrl, getForJson } from "@grocy-trolley/utils/fetch-utils";
import { headers, HeadersBuilder } from "@grocy-trolley/utils/headers-builder";
import { components } from "./api";

type Schemas = components["schemas"];

export abstract class GrocyRestService {
  abstract readonly baseUrl: string;

  constructor(private readonly apiKey: string) {}

  protected authHeaders(): HeadersBuilder {
    return headers().append("GROCY-API-KEY", this.apiKey);
  }

  protected buildUrl(path: string, params?: Record<string, string>): string {
    return buildUrl(this.baseUrl, path, params);
  }

  protected async getEntities<K extends keyof Schemas>(
    entity: Schemas["ExposedEntity"]
  ): Promise<Schemas[K][]> {
    return getForJson(
      `${this.baseUrl}/objects/${entity}`,
      this.authHeaders().acceptJson().build()
    );
  }
}
