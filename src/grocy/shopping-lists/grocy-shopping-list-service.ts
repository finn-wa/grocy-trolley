import { toDateString } from "@gt/utils/date";
import { Logger } from "@gt/utils/logger";
import chalk from "chalk";
import prompts from "prompts";
import { GrocySingleEntityService } from "../rest/grocy-entity-rest-service";
import { GrocyRestService } from "../rest/grocy-rest-service";
import { ShoppingList, ShoppingListDetail } from "./types/ShoppingList";
import { getShoppingListSchema, getShoppingListsSchema } from "./types/ShoppingList/schema";
import { ShoppingListItem } from "./types/ShoppingListItems";
import {
  getShoppingListItemsSchema,
  parseShoppingListItem,
} from "./types/ShoppingListItems/schema";

export class GrocyShoppingListService extends GrocyRestService {
  protected logger = new Logger(this.constructor.name);
  private readonly listService = new GrocySingleEntityService(
    "shopping_lists",
    getShoppingListSchema,
    getShoppingListsSchema
  );
  private readonly itemService = new GrocySingleEntityService(
    "shopping_list",
    () => undefined,
    getShoppingListItemsSchema
  );

  async getShoppingList(id: string): Promise<ShoppingListDetail> {
    const list = await this.listService.getEntityObject(id);
    return { ...list, items: await this.getShoppingListItems(id) };
  }

  async getShoppingLists(): Promise<ShoppingList[]> {
    return this.listService.getAllEntityObjects();
  }

  /**
   * Creates a shopping list
   * @param name Shopping list name
   * @returns created object ID
   */
  async createShoppingList(name: string): Promise<string> {
    return this.listService.postEntityObject({ name });
  }

  /**
   * Returns all shopping list items, optionally filtered by shopping list ID
   * @param id Shopping list ID
   * @returns an array of shopping list items
   */
  async getShoppingListItems(id?: string): Promise<ShoppingListItem[]> {
    const params = id ? `?query[]=shopping_list_id=${id}` : "";
    const rawItems = await this.getAndParse(
      this.buildUrl("/objects/shopping_list" + params),
      { headers: this.authHeaders().acceptJson().build() },
      getShoppingListItemsSchema()
    );
    return rawItems.map(parseShoppingListItem);
  }

  async promptForShoppingList(): Promise<string | null> {
    const lists = await this.getShoppingLists();
    if (lists.length === 0) {
      return null;
    }
    const choice = await prompts({
      type: "select",
      name: "listId",
      message: "Select a shopping list",
      choices: [
        ...lists.map((list) => ({
          title: `${chalk.gray(toDateString(list.row_created_timestamp))} - ${list.name}`,
          value: list.id,
        })),
        { title: "Exit", value: null },
      ],
    });
    return choice.listId as string | null;
  }
}
