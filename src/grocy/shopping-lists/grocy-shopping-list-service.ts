import { Logger } from "@gt/utils/logger";
import { GrocyEntityRestService } from "../rest/grocy-entity-rest-service";
import { ShoppingList, ShoppingListDetail } from "./types/ShoppingList";
import { getShoppingListSchema, getShoppingListsSchema } from "./types/ShoppingList/schema";
import { ShoppingListItem } from "./types/ShoppingListItems";

export class GrocyShoppingListService extends GrocyEntityRestService {
  protected logger = new Logger(this.constructor.name);

  async getShoppingList(id: string): Promise<ShoppingListDetail> {
    const list = await this.getEntityObject("shopping_lists", id, getShoppingListSchema());
    return { ...list, items: await this.getShoppingListItems(id) };
  }

  async getAllShoppingLists(): Promise<ShoppingList[]> {
    return this.getAllEntityObjects("shopping_lists", getShoppingListsSchema());
  }

  /**
   * Creates a shopping list
   * @param name Shopping list name
   * @returns created object ID
   */
  async createShoppingList(name: string): Promise<string> {
    return this.postEntityObject("shopping_lists", { name });
  }

  /**
   * Returns all shopping list items, optionally filtered by shopping list ID
   * @param id Shopping list ID
   * @returns an array of shopping list items
   */
  async getShoppingListItems(id?: string): Promise<ShoppingListItem[]> {
    const items = await this.getShoppingListItems();
    if (id) {
      return items.filter((item) => item.shopping_list_id === id);
    }
    return items;
  }
}
