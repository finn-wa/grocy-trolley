import { Logger } from "@gt/utils/logger";
import { GrocyRestService } from "../rest/grocy-rest-service";
import { ShoppingListItem } from "./types/ShoppingListItems";
import {
  getShoppingListItemsSchema,
  parseShoppingListItem,
} from "./types/ShoppingListItems/schema";

export class GrocyShoppingListService extends GrocyRestService {
  protected logger = new Logger(this.constructor.name);

  /**
   * Gets all shopping list items across all lists
   * @returns Shopping list items
   */
  async getAllShoppingListItems(): Promise<ShoppingListItem[]> {
    const rawShoppingListItems = await this.getAndParse(
      this.buildUrl("/objects/shopping_list"),
      { headers: this.authHeaders().acceptJson().build() },
      getShoppingListItemsSchema()
    );
    return rawShoppingListItems.map(parseShoppingListItem);
  }

  async getShoppingList(id: string): Promise<ShoppingListItem[]> {
    const items = await this.getAllShoppingListItems();
    return items.filter((item) => item.shopping_list_id === id);
  }
}
