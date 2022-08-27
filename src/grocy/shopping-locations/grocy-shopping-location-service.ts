import { Lifecycle, scoped } from "tsyringe";
import { GrocySingleEntityService } from "../rest/grocy-entity-rest-service";
import { ShoppingLocation } from "./types/ShoppingLocations";

@scoped(Lifecycle.ContainerScoped)
export class GrocyShoppingLocationService {
  private readonly rest = new GrocySingleEntityService<ShoppingLocation>("shopping_locations");

  async getShoppingLocations(): Promise<ShoppingLocation[]> {
    return this.rest.getEntityObjects();
  }

  async getShoppingLocation(id: string): Promise<ShoppingLocation> {
    return this.rest.getEntityObject(id);
  }
}
