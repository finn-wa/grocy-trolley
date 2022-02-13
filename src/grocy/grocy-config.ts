import { GrocySchemas } from "./grocy-model";
import { GrocyRestService } from "./grocy-rest-service";

export type StoreBrand = "PAK'n'SAVE" | "New World" | "Countdown";

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
export const QUANTITY_UNITS = ["piece", "pack", "g", "kg", "mL", "L"] as const;
export type QuantityUnitName = typeof QUANTITY_UNITS[number];

export class GrocyConfigService extends GrocyRestService {
  constructor(apiKey: string, readonly baseUrl: string) {
    super(apiKey);
  }

  async getLocationIds(): Promise<Record<GrocyLocation, number>> {
    const locations = await this.getEntities<"Location">("locations");
    const storedLocations = locations.map((unit) => unit.name);
    const missingLocations = GROCY_LOCATIONS.filter(
      (location) => !storedLocations.includes(location)
    );
    if (missingLocations.length > 0) {
      throw new Error(
        `The following locations are missing from grocy: '${missingLocations.join(
          ", "
        )}'`
      );
    }
    return Object.fromEntries(
      locations.map((unit: GrocySchemas["Location"]) => [unit.name, unit.id])
    );
  }

  async getQuantityUnitIds(): Promise<Record<QuantityUnitName, number>> {
    const quantityUnits = await this.getEntities<"QuantityUnit">(
      "quantity_units"
    );
    const storedUnitNames = quantityUnits.map((unit) => unit.name);
    const missingUnits = QUANTITY_UNITS.filter(
      (unit) => !storedUnitNames.includes(unit)
    );
    if (missingUnits.length > 0) {
      throw new Error(
        `The following units are missing from grocy: '${missingUnits.join(
          ", "
        )}'`
      );
    }
    return Object.fromEntries(
      quantityUnits.map((unit) => [unit.name, unit.id])
    );
  }
}
