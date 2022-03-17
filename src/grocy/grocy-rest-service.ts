import { getEnv } from "env";
import { Response } from "node-fetch";
import { headers, HeadersBuilder } from "utils/headers-builder";
import { RestService } from "utils/rest";
import { components } from "./api";

type Schemas = components["schemas"];

export abstract class GrocyRestService extends RestService {
  private readonly env = getEnv();
  private readonly apiKey = this.env.GROCY_API_KEY;
  protected readonly baseUrl = this.validateBaseUrl(this.env.GROCY_URL);

  protected authHeaders(): HeadersBuilder {
    return headers().append("GROCY-API-KEY", this.apiKey);
  }

  protected async getEntities<K extends keyof Schemas>(
    entityName: Schemas["ExposedEntity"]
  ): Promise<Schemas[K][]> {
    return this.getForJson(
      this.buildUrl("objects/" + entityName),
      this.authHeaders().acceptJson().build()
    );
  }

  protected async getEntity<K extends keyof Schemas>(
    entityName: Schemas["ExposedEntity"],
    id: string | number
  ): Promise<Schemas[K]> {
    return this.getForJson(
      this.buildUrl(`objects/${entityName}/${id}`),
      this.authHeaders().acceptJson().build()
    );
  }

  protected async updateEntity<K extends keyof Schemas>(
    entityName: Schemas["ExposedEntity"],
    id: string | number,
    entity: Schemas[K]
  ): Promise<Response> {
    return this.postForJson(
      this.buildUrl(`objects/${entityName}/${id}`),
      this.authHeaders().acceptJson().contentTypeJson().build(),
      entity
    );
  }
}
