import { getEnv } from "utils/environment";
import { headersBuilder, HeadersBuilder } from "utils/headers";
import { RestService } from "utils/rest";
import { CreatedObjectId, GrocySchemas } from "./grocy-model";

export abstract class GrocyRestService extends RestService {
  private readonly env = getEnv();
  private readonly apiKey = this.env.GROCY_API_KEY;
  protected readonly baseUrl = this.validateBaseUrl(this.env.GROCY_URL);

  protected authHeaders(): HeadersBuilder {
    return headersBuilder().append("GROCY-API-KEY", this.apiKey);
  }

  protected async getEntities<K extends keyof GrocySchemas>(
    entityName: GrocySchemas["ExposedEntity"]
  ): Promise<GrocySchemas[K][]> {
    return this.getForJson(
      this.buildUrl("objects/" + entityName),
      this.authHeaders().acceptJson().build()
    );
  }

  protected async getEntity<K extends keyof GrocySchemas>(
    entityName: GrocySchemas["ExposedEntity"],
    id: string | number
  ): Promise<GrocySchemas[K]> {
    return this.getForJson(
      this.buildUrl(`objects/${entityName}/${id}`),
      this.authHeaders().acceptJson().build()
    );
  }

  protected async updateEntity<K extends keyof GrocySchemas>(
    entityName: GrocySchemas["ExposedEntity"],
    id: string | number,
    entity: GrocySchemas[K]
  ): Promise<Response> {
    return this.put(
      this.buildUrl(`objects/${entityName}/${id}`),
      this.authHeaders().acceptJson().contentTypeJson().build(),
      entity
    );
  }

  protected async createEntity<K extends keyof GrocySchemas>(
    entityName: GrocySchemas["ExposedEntity"],
    entity: GrocySchemas[K]
  ): Promise<CreatedObjectId> {
    return this.postForJson(
      this.buildUrl(`objects/${entityName}`),
      this.authHeaders().acceptJson().contentTypeJson().build(),
      entity
    );
  }
}
