import { getForJson, postForJson, put } from "@grocy-trolley/utils/fetch-utils";
import { prettyPrint } from "@grocy-trolley/utils/logging-utils";
import { Response } from "node-fetch";
import { GrocyRestService } from "./grocy-rest-service";

export class GrocyUserEntityService extends GrocyRestService {
  /** Cached entities - not expected to change in the lifetime of the service. */
  private entities?: UserEntity[];

  constructor(apiKey: string, readonly baseUrl: string) {
    super(apiKey);
  }

  /**
   * Gets user entities. Returns a cached copy if available, unless refresh is
   * set to true.
   *
   * @param refresh Whether to force refresh cached value
   * @returns Array of user entities
   */
  async getUserEntities(refresh = false): Promise<UserEntity[]> {
    if (!refresh && !!this.entities) {
      return this.entities;
    }
    const entities: UserEntity[] = await getForJson(
      this.buildUrl("objects/userentities"),
      this.authHeaders().acceptJson().build()
    );
    this.entities = entities;
    return entities;
  }

  /**
   * Returns the ID of the user entity with the specified name
   * @param name The user entity name (not the display name)
   * @returns The ID
   */
  async getUserEntityId(name: string): Promise<string> {
    const entities = await this.getUserEntities();
    const entity = entities.find((e) => e.name === name);
    if (!entity) {
      throw new Error(
        `No entity with name '${name}': ${prettyPrint(entities)}`
      );
    }
    return entity.id;
  }

  async createUserObject(entityName: string, obj: any): Promise<Response> {
    const entityId = await this.getUserEntityId(entityName);
    const response: CreatedUserObject = await postForJson(
      this.buildUrl("objects/userobjects"),
      this.authHeaders().acceptJson().contentTypeJson().build(),
      { userentity_id: entityId }
    );
    const objectId = response.created_object_id;
    return put(
      this.buildUrl(`userfields/userentity-${entityName}/${objectId}`),
      this.authHeaders().contentTypeJson().build(),
      obj
    );
  }
}

export interface UserEntity {
  id: string;
  name: string;
  caption: string;
  description: string;
  show_in_sidebar_menu: string;
  icon_css_class: string;
  row_created_timestamp: string;
}

export interface CreatedUserObject {
  created_object_id: string;
}
