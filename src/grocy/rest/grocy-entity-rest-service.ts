import { Logger } from "@gt/utils/logger";
import { ValidateFunction } from "ajv";
import { getCreatedObjectIdSchema, GrocyEntity } from "../types/grocy-types";
import { GrocyRestService } from "./grocy-rest-service";

/**
 * A filter condition in the format `{{ field }}{{ condition }}{{ value }}` where
 * - `{{ field }}` is a valid field name
 * - `{{ condition }}` is a comparison operator, one of:
 *    * `=` equal
 *    * `!=` not equal
 *    * `~` LIKE
 *    * `!~` not LIKE
 *    * `<` less
 *    * `>` greater
 *    * `<=` less or equal
 *    * `>=` greater or equal
 *    * `§` regular expression
 * - `{{ value }}` is the value to search for
 */
export type GrocyEntityObjectFilter = string;

export class GrocyEntityService extends GrocyRestService {
  protected readonly logger = new Logger(this.constructor.name);

  /**
   * Gets all grocy objects for a given entity - optionally filtered.
   * @param entity The name of the entity
   * @param filter a filter condition - see {@link GrocyEntityObjectFilter}
   * @returns An array containing all entity objects
   */
  async getEntityObjects<T>(
    entity: GrocyEntity,
    validate?: ValidateFunction<T[]>,
    filter: GrocyEntityObjectFilter = ""
  ): Promise<T[]> {
    if (filter.length > 0) filter = "?" + filter;
    return this.getAndParse(
      this.buildUrl(`/objects/${entity}${filter}`),
      { headers: this.authHeaders().acceptJson().build() },
      validate
    );
  }

  /**
   * Gets a grocy object for a given entity.
   * @param entity The name of the object's entity. Used in the url: `objects/{entity}/{id}`
   * @param id The ID of the object to get
   * @returns The requested object
   */
  async getEntityObject<T>(
    entity: GrocyEntity,
    id: string,
    validate?: ValidateFunction<T>
  ): Promise<T> {
    return this.getAndParse(
      this.buildUrl(`objects/${entity}/${id}`),
      { headers: this.authHeaders().acceptJson().build() },
      validate
    );
  }

  /**
   * Updates a grocy object.
   * @param entity The name of the object's entity. Used in the url: `objects/{entity}/{id}`
   * @param id The ID of the object to update
   * @param obj The new object value
   * @returns The HTTP response - 204 if successful, 400 if not.
   */
  async putEntityObject(entity: GrocyEntity, id: string, obj: unknown): Promise<Response> {
    return this.put(this.buildUrl(`/objects/${entity}/${id}`), {
      headers: this.authHeaders().acceptJson().contentTypeJson().build(),
      body: JSON.stringify(obj),
    });
  }

  /**
   * Creates a grocy object for a given entity.
   * @param entity The name of the object's entity. Used in the url: `objects/{entity}`
   * @returns The ID of the newly created object
   */
  async postEntityObject(entity: GrocyEntity, obj: unknown): Promise<string> {
    const response = await this.postAndParse(
      this.buildUrl(`/objects/${entity}`),
      {
        headers: this.authHeaders().acceptJson().contentTypeJson().build(),
        body: JSON.stringify(obj),
      },
      getCreatedObjectIdSchema()
    );
    return response.created_object_id;
  }

  /**
   * Deletes a grocy object.
   * @param entity The name of the object's entity. Used in the url: `objects/{entity}/{id}`
   * @param id The ID of the object to delete
   * @returns The HTTP response - 204 if successful, 400 if not.
   */
  async deleteEntityObject(entity: GrocyEntity, id: string): Promise<Response> {
    return this.delete(this.buildUrl(`/objects/${entity}/${id}`), {
      headers: this.authHeaders().build(),
    });
  }
}

export class GrocySingleEntityService<T = unknown> extends GrocyRestService {
  private readonly entityService = new GrocyEntityService();
  protected readonly logger: Logger;

  constructor(
    readonly entity: GrocyEntity,
    private readonly validate: () => ValidateFunction<T> | undefined = () => undefined,
    private readonly validateArray: () => ValidateFunction<T[]> | undefined = () => undefined
  ) {
    super();
    this.logger = new Logger(`GrocySingleEntityService[${this.entity}]`);
  }

  getEntityObjects(filter: GrocyEntityObjectFilter = ""): Promise<T[]> {
    return this.entityService.getEntityObjects<T>(this.entity, this.validateArray(), filter);
  }

  getEntityObject(id: string) {
    return this.entityService.getEntityObject<T>(this.entity, id, this.validate());
  }

  putEntityObject(id: string, obj: T): Promise<Response> {
    return this.entityService.putEntityObject(this.entity, id, obj);
  }

  postEntityObject(obj: Partial<T>): Promise<string> {
    return this.entityService.postEntityObject(this.entity, obj);
  }

  deleteEntityObject(id: string): Promise<Response> {
    return this.entityService.deleteEntityObject(this.entity, id);
  }
}
