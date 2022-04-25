import { FoodstuffsCategory, FOODSTUFFS_CATEGORIES } from "@gt/store/foodstuffs";
import { Logger } from "@gt/utils/logger";
import { GrocySchemas } from "./grocy-model";
import { GrocyRestService } from "./grocy-rest-service";

export type StoreBrand = "PNS" | "NW" | "CD";

export const GROCY_LOCATIONS = [
  "Bathroom",
  "Bedroom",
  "Garage Freezer",
  "Garage Fridge",
  "Garage Storage",
  "Kitchen Bench",
  "Kitchen Freezer",
  "Kitchen Fridge",
  "Kitchen Shared Drawer",
  "Pantry",
] as const;

export type GrocyLocation = typeof GROCY_LOCATIONS[number];

export type QuantityUnit = GrocySchemas["QuantityUnit"];
export const QUANTITY_UNITS = ["ea", "pk", "g", "kg", "mL", "L"] as const;
export type QuantityUnitName = typeof QUANTITY_UNITS[number];

export const GROCY_PRODUCT_GROUPS = FOODSTUFFS_CATEGORIES;
export type GrocyProductGroup = FoodstuffsCategory;

export class GrocyIdMapService extends GrocyRestService {
  protected readonly logger = new Logger(this.constructor.name);

  async getAllIdMaps(): Promise<GrocyIdMaps> {
    const idMaps = await Promise.all([
      this.getLocationIdMap(),
      this.getQuantityUnitIdMap(),
      this.getProductGroupIdMap(),
      this.getShoppingLocationIdMap(),
    ]);
    return new GrocyIdMaps(...idMaps);
  }

  async getShoppingLocationIdMap(): Promise<Record<string, number>> {
    const shoppingLocations = await this.getEntities<"ShoppingLocation">("shopping_locations");
    return Object.fromEntries(shoppingLocations.map((loc) => [loc.userfields.storeId, loc.id]));
  }

  async getLocationIdMap(): Promise<Record<GrocyLocation, number>> {
    const locations = await this.getEntities<"Location">("locations");
    const locationNames = locations.map((unit) => unit.name);
    const missingLocations = GROCY_LOCATIONS.filter(
      (location) => !locationNames.includes(location)
    );
    if (missingLocations.length > 0) {
      throw new Error(
        `The following locations are missing from grocy: '${missingLocations.join(", ")}'`
      );
    }
    return Object.fromEntries(
      locations.map((loc: GrocySchemas["Location"]) => [loc.name, loc.id])
    ) as Record<string, number>;
  }

  async getQuantityUnitIdMap(): Promise<Record<QuantityUnitName, number>> {
    const quantityUnits = await this.getEntities<"QuantityUnit">("quantity_units");
    const unitNames = quantityUnits.map((unit) => unit.name);
    const missingUnits = QUANTITY_UNITS.filter((unit) => !unitNames.includes(unit));
    if (missingUnits.length > 0) {
      throw new Error(`The following units are missing from grocy: '${missingUnits.join(", ")}'`);
    }
    return Object.fromEntries(quantityUnits.map((unit) => [unit.name, unit.id])) as Record<
      QuantityUnitName,
      number
    >;
  }

  async getProductGroupIdMap(): Promise<Record<GrocyProductGroup, number>> {
    let productGroups = await this.getEntities<"ProductGroup">("product_groups");
    const productGroupNames = productGroups.map((unit) => unit.name);
    const missingProductGroups = FOODSTUFFS_CATEGORIES.filter(
      (name) => !productGroupNames.includes(name)
    );
    if (missingProductGroups.length > 0) {
      const missing = missingProductGroups.join(", ");
      this.logger.warn(`Categories are missing from grocy: '${missing}'`);
      for (const pg of missingProductGroups) {
        await this.postForJson(
          this.buildUrl("objects/product_groups"),
          this.authHeaders().acceptJson().contentTypeJson().build(),
          { name: pg, description: "" }
        );
      }
      productGroups = await this.getEntities<"ProductGroup">("product_groups");
    }
    return Object.fromEntries(
      productGroups.map((unit) => [unit.name, Number.parseInt(unit.id)])
    ) as Record<GrocyProductGroup, number>;
  }
}

export class GrocyIdMaps {
  readonly locationNames: Record<number, GrocyLocation>;
  readonly quantityUnitNames: Record<number, QuantityUnitName>;
  readonly productGroupNames: Record<number, GrocyProductGroup>;
  readonly shoppingLocationNames: Record<number, string>;

  constructor(
    readonly locationIds: Record<GrocyLocation, number>,
    readonly quantityUnitIds: Record<QuantityUnitName, number>,
    readonly productGroupIds: Record<GrocyProductGroup, number>,
    /** Third-party store location ID to Grocy ID */
    readonly shoppingLocationIds: Record<string, number>
  ) {
    this.locationNames = this.toNameMap(locationIds);
    this.quantityUnitNames = this.toNameMap(quantityUnitIds);
    this.productGroupNames = this.toNameMap(productGroupIds);
    this.shoppingLocationNames = this.toNameMap(shoppingLocationIds);
  }

  private toNameMap<T extends string>(namesToIds: Record<T, number>): Record<number, T> {
    return Object.fromEntries(Object.entries(namesToIds).map(([name, id]) => [id, name]));
  }

  /**
   * Warning: defaults to ea if not found
   */
  matchQuantityUnit(unit: string): QuantityUnitName {
    const lowercasedUnit = unit.toLowerCase();
    const resolvedUnit = QUANTITY_UNITS.find((u) => u.toLowerCase() === lowercasedUnit);
    return resolvedUnit ?? "ea";
  }
}
