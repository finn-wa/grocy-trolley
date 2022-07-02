import { QuantityUnitName, QUANTITY_UNITS } from "../grocy-config";
import { GrocyIdLookupService } from "./grocy-id-lookup-service";

export class GrocyQuantityUnitIdLookupService extends GrocyIdLookupService<QuantityUnitName> {
  private readonly quantityUnitIds = [...QUANTITY_UNITS];
  protected fetchMapOfKeysToGrocyIds = () =>
    this.fetchMapOfEntityKeysToIds<{ id: string; name: string }>(
      "quantity_units",
      "name",
      this.quantityUnitIds
    );

  /**
   * Warning: defaults to ea if not found
   */
  matchQuantityUnit(unit: string): QuantityUnitName {
    const lowercasedUnit = unit.toLowerCase();
    const resolvedUnit = this.quantityUnitIds.find((u) => u.toLowerCase() === lowercasedUnit);
    return resolvedUnit ?? "ea";
  }
}
