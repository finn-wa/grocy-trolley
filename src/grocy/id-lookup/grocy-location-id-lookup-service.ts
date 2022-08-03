import { singleton } from "tsyringe";
import { GrocyLocation, GROCY_LOCATIONS } from "../grocy-config";
import { GrocyIdLookupService } from "./grocy-id-lookup-service";

@singleton()
export class GrocyLocationIdLookupService extends GrocyIdLookupService<GrocyLocation> {
  private readonly grocyLocations = [...GROCY_LOCATIONS];

  protected async fetchMapOfKeysToGrocyIds(): Promise<Record<GrocyLocation, string>> {
    return this.fetchMapOfEntityKeysToIds<{ id: string; name: string }>(
      "locations",
      (loc) => loc.name,
      this.grocyLocations
    );
  }
}
