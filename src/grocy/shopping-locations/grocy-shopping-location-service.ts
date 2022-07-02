import { Logger } from "@gt/utils/logger";
import { AbstractGrocyEntityRestService } from "../rest/grocy-entity-rest-service";
import { ShoppingLocation } from "./types/ShoppingLocations";
import { getShoppingLocationsSchema } from "./types/ShoppingLocations/schema";

export class GrocyShoppingLocationService extends AbstractGrocyEntityRestService<ShoppingLocation> {
  protected readonly entity = "shopping_locations";
  protected readonly logger = new Logger(this.constructor.name);

  getShoppingLocations() {
    return this.getAllEntityObjects(getShoppingLocationsSchema());
  }
}
