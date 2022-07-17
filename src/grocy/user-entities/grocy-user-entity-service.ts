import { Logger, prettyPrint } from "@gt/utils/logger";
import { GrocyEntityService } from "../rest/grocy-entity-rest-service";
import { GrocyRestService } from "../rest/grocy-rest-service";
import {
  CreatedObjectResponse,
  UserEntity,
  UserEntityName,
  UserObjectReference,
  UserObjects,
} from "./types";

export class GrocyUserEntityService extends GrocyRestService {
  protected readonly logger = new Logger(this.constructor.name);
  private readonly entityService = new GrocyEntityService();
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
    const entities: UserEntity[] = await this.entityService.getAllEntityObjects("userentities");
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
    return this.entityService.getAllEntityObjects("userobjects");
  }

  async getUserObject<Name extends UserEntityName>(
    userEntityName: Name,
    objectId: number | string
  ): Promise<UserObjects[Name]> {
    return this.getAndParse(this.buildUrl(`userfields/userentity-${userEntityName}/${objectId}`), {
      headers: this.authHeaders().acceptJson().build(),
    });
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

  async createUserObject(entityName: UserEntityName, obj: unknown): Promise<CreatedObjectResponse> {
    const entityId = await this.getUserEntityId(entityName);
    const objectId = await this.entityService.postEntityObject("userobjects", {
      userentity_id: entityId,
    });
    const response = await this.fetch(
      this.buildUrl(`userfields/userentity-${entityName}/${objectId}`),
      {
        method: "PUT",
        headers: this.authHeaders().contentTypeJson().build(),
        body: JSON.stringify(obj),
      }
    );
    return { response, objectId };
  }

  async updateUserObject<Name extends UserEntityName>(
    entityName: Name,
    objectId: string | number,
    body: UserObjects[Name]
  ): Promise<Response> {
    return this.fetch(this.buildUrl(`userfields/userentity-${entityName}/${objectId}`), {
      method: "PUT",
      headers: this.authHeaders().contentTypeJson().build(),
      body: JSON.stringify(body),
    });
  }
}
