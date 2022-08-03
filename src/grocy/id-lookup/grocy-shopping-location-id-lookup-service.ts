import { singleton } from "tsyringe";
import { ShoppingLocation } from "../shopping-locations/types/ShoppingLocations";
import { GrocyIdLookupService } from "./grocy-id-lookup-service";

@singleton()
export class GrocyShoppingLocationIdLookupService extends GrocyIdLookupService<string> {
  protected async fetchMapOfKeysToGrocyIds(): Promise<Record<string, string>> {
    return this.fetchMapOfEntityKeysToIds<ShoppingLocation>(
      "shopping_locations",
      (loc) => loc.userfields.storeId
    );
  }
}
