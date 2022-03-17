import { Logger } from "@grocy-trolley/utils/logger";
import { GrocySchemas } from "./grocy-model";
import { GrocyRestService } from "./grocy-rest-service";

export type ShoppingListItem = GrocySchemas["ShoppingListItem"];

export class GrocyShoppingListService extends GrocyRestService {
  protected logger = new Logger(this.constructor.name);

  getShoppingListItems(): Promise<ShoppingListItem[]> {
    return this.getEntities<"ShoppingListItem">("shopping_list");
  }
}
