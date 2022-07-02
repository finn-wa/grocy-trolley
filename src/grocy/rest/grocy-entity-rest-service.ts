import { Logger } from "@gt/utils/logger";
import { ValidateFunction } from "ajv";
import { getCreatedObjectIdSchema, GrocyEntity } from "../types/grocy-types";
import { GrocyRestService } from "./grocy-rest-service";

export class GrocyEntityRestService extends GrocyRestService {
  protected readonly logger = new Logger(this.constructor.name);

  /**
   * Gets all grocy objects for a given entity.
   * @param entity The name of the entity
   * @returns An array containing all entity objects
   */
  async getAllEntityObjects<T>(
    entity: GrocyEntity,
    validate?: ValidateFunction<T[]>
  ): Promise<T[]> {
    return this.getAndParse(
      this.buildUrl(`/objects/${entity}`),
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

export abstract class AbstractGrocyEntityRestService<T = unknown> extends GrocyRestService {
  private readonly entityService = new GrocyEntityRestService();
  protected abstract readonly entity: GrocyEntity;

  protected getAllEntityObjects(validate?: ValidateFunction<T[]>): Promise<T[]> {
    return this.entityService.getAllEntityObjects<T>(this.entity, validate);
  }

  protected getEntityObject(id: string, validate?: ValidateFunction<T>) {
    return this.entityService.getEntityObject<T>(this.entity, id, validate);
  }

  protected putEntityObject(id: string, obj: T): Promise<Response> {
    return this.entityService.putEntityObject(this.entity, id, obj);
  }

  protected postEntityObject(obj: T): Promise<string> {
    return this.entityService.postEntityObject(this.entity, obj);
  }

  protected deleteEntityObject(id: string): Promise<Response> {
    return this.entityService.deleteEntityObject(this.entity, id);
  }
}
