import { Logger, prettyPrint } from "utils/logger";
import { StoreBrand } from "./grocy-config";
import { CreatedObjectId, GrocyBoolean } from "./grocy-model";
import { GrocyRestService } from "./grocy-rest-service";

export class GrocyUserEntityService extends GrocyRestService {
  protected readonly logger = new Logger(this.constructor.name);

  /** Cached entities - not expected to change in the lifetime of the service. */
  private entities?: UserEntity[];

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
    const entities: UserEntity[] = await this.getForJson(
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
  async getUserEntityId(name: UserEntityName): Promise<string> {
    const entities = await this.getUserEntities();
    const entity = entities.find((e) => e.name === name);
    if (!entity) {
      throw new Error(`No entity with name '${name}': ${prettyPrint(entities)}`);
    }
    return entity.id;
  }

  async getUserObjectReferences(): Promise<UserObjectReference[]> {
    return this.getEntities<"UserObjectReference">("userobjects");
  }

  async getUserObject<Name extends UserEntityName>(
    userEntityName: Name,
    objectId: number | string
  ): Promise<UserObjects[Name]> {
    return this.getForJson(
      this.buildUrl(`userfields/userentity-${userEntityName}/${objectId}`),
      this.authHeaders().acceptJson().build()
    );
  }

  async getObjectsForUserEntity<Name extends UserEntityName>(
    userEntityName: Name
  ): Promise<UserObjects[Name][]> {
    const entityId = await this.getUserEntityId(userEntityName);
    const userObjectRefs = await this.getUserObjectReferences();
    return Promise.all(
      userObjectRefs
        .filter((ref) => ref.userentity_id === entityId)
        .map((ref) => this.getUserObject(userEntityName, ref.id))
    );
  }

  async createUserObject(entityName: UserEntityName, obj: any): Promise<CreatedObjectResponse> {
    const entityId = await this.getUserEntityId(entityName);
    const postResponse: CreatedObjectId = await this.postForJson(
      this.buildUrl("objects/userobjects"),
      this.authHeaders().acceptJson().contentTypeJson().build(),
      { userentity_id: entityId }
    );
    const objectId = postResponse.created_object_id;
    const response = await this.put(
      this.buildUrl(`userfields/userentity-${entityName}/${objectId}`),
      this.authHeaders().contentTypeJson().build(),
      obj
    );
    return { response, objectId };
  }

  async updateUserObject<Name extends UserEntityName>(
    entityName: Name,
    objectId: string | number,
    body: UserObjects[Name]
  ): Promise<Response> {
    return this.put(
      this.buildUrl(`userfields/userentity-${entityName}/${objectId}`),
      this.authHeaders().contentTypeJson().build(),
      body
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

export interface CreatedObjectResponse {
  response: Response;
  objectId: string;
}

/**
 * Returned from /api/objects/userobjects. Useful as a crossreference because
 * GET /objects/userentity-xxx is not exposed and user objects have to be
 * retrieved one at a time from /userfields/:entity/:objectId, which is fun.
 */
export interface UserObjectReference {
  userentity_id: string;
  id: string;
  row_created_timestamp: string;
}

export interface UserObjects extends Record<string, Record<string, string>> {
  order: {
    /** YYYY-MM-DD */
    date: string;
    brand: StoreBrand;
    imported: GrocyBoolean;
    orderId: string;
    notes?: string;
  };
}

export type UserEntityName = keyof UserObjects;
export type OrderRecord = UserObjects["order"];
