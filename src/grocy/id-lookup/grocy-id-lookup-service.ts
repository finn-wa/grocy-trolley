import { prettyPrint } from "@gt/utils/logger";
import dedent from "dedent";
import { GrocyEntityService } from "../rest/grocy-entity-rest-service";
import { GrocyEntity } from "../types/grocy-types";

/**
 * Base class for ID lookup services that map known keys to grocy IDs (and vice versa).
 * Assumes keys and grocy IDs have a 1:1 mapping.
 */
export abstract class GrocyIdLookupService<K extends string = string> {
  protected readonly entityService = new GrocyEntityService();
  private keysToGrocyIds: Record<K, string> | null = null;
  private grocyIdsToKeys: Record<string, K> | null = null;

  protected abstract fetchMapOfKeysToGrocyIds(): Promise<Record<K, string>>;

  protected async fetchMapOfEntityKeysToIds<T extends { id: string }>(
    entity: GrocyEntity,
    keyGetter: keyof T | ((obj: T) => string),
    requiredKeys?: K[]
  ): Promise<Record<K, string>> {
    const _keyGetter =
      typeof keyGetter === "string"
        ? (obj: T) => obj[keyGetter as keyof T] as unknown as string
        : (keyGetter as (obj: T) => string);

    const entities = await this.entityService.getAllEntityObjects<T>(entity);
    if (requiredKeys) {
      const entityKeys = entities.map(_keyGetter);
      const missingKeys = requiredKeys.filter((key) => !entityKeys.includes(key));
      if (missingKeys.length > 0) {
        throw new Error(dedent`
          Grocy is missing required ${entity} with keys: '${missingKeys.join(", ")}'
          Found these ${entity}: ${prettyPrint(entities)}
        `);
      }
    }
    const mappedEntries = entities.map((entity) => [_keyGetter(entity), entity.id]);
    return Object.fromEntries(mappedEntries) as Record<K, string>;
  }

  async getMapOfKeysToGrocyIds(): Promise<Record<K, string>> {
    if (!this.keysToGrocyIds) {
      this.keysToGrocyIds = await this.fetchMapOfKeysToGrocyIds();
    }
    return this.keysToGrocyIds;
  }

  async getMapOfGrocyIdsToKeys(): Promise<Record<string, K>> {
    if (!this.grocyIdsToKeys) {
      const keysToGrocyIds = await this.getMapOfKeysToGrocyIds();
      const reverseEntries = Object.entries(keysToGrocyIds).map(([key, id]) => [id, key]);
      this.grocyIdsToKeys = Object.fromEntries(reverseEntries) as Record<string, K>;
    }
    return this.grocyIdsToKeys;
  }

  async getGrocyId(key: K): Promise<string | undefined> {
    const keysToGrocyIds = await this.getMapOfKeysToGrocyIds();
    return keysToGrocyIds[key];
  }

  async getRequiredGrocyId(key: K): Promise<string> {
    const grocyId = await this.getGrocyId(key);
    if (!grocyId) {
      throw new Error(`Missing grocy ID for key '${key}'`);
    }
    return grocyId;
  }

  async getKey(grocyId: string): Promise<K | undefined> {
    const grocyIdsToKeys = await this.getMapOfGrocyIdsToKeys();
    return grocyIdsToKeys[grocyId];
  }

  async getRequiredKey(grocyId: string): Promise<K> {
    const key = await this.getKey(grocyId);
    if (!key) {
      throw new Error(`Missing key for grocy ID '${grocyId}'`);
    }
    return key;
  }
}
