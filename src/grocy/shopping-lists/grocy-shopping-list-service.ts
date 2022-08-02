import { grocyShortDate } from "@gt/utils/date";
import { Logger } from "@gt/utils/logger";
import { RequestError } from "@gt/utils/rest";
import chalk from "chalk";
import prompts from "prompts";
import { GrocySingleEntityService } from "../rest/grocy-entity-rest-service";
import { GrocyRestService } from "../rest/grocy-rest-service";
import { ShoppingList, ShoppingListDetail } from "./types/ShoppingList";
import { getShoppingListSchema, getShoppingListsSchema } from "./types/ShoppingList/schema";
import { NewShoppingListItem, ShoppingListItem } from "./types/ShoppingListItems";
import {
  getShoppingListItemsSchema,
  parseShoppingListItem,
} from "./types/ShoppingListItems/schema";

// todo: method that makes copy of list with resolved parent products
// this can then be used across all exporters

export class GrocyShoppingListService extends GrocyRestService {
  protected logger = new Logger(this.constructor.name);
  private readonly listService = new GrocySingleEntityService(
    "shopping_lists",
    getShoppingListSchema,
    getShoppingListsSchema
  );
  private readonly itemService = new GrocySingleEntityService(
    "shopping_list",
    undefined,
    getShoppingListItemsSchema
  );

  async getShoppingList(id: string): Promise<ShoppingListDetail> {
    const list = await this.listService.getEntityObject(id);
    return { ...list, items: await this.getShoppingListItems(id) };
  }

  async getShoppingLists(): Promise<ShoppingList[]> {
    return this.listService.getEntityObjects();
  }

  /**
   * Creates a shopping list
   * @param name Shopping list name
   * @returns created object ID
   */
  async createShoppingList(
    name: string,
    items: Omit<NewShoppingListItem, "shopping_list_id">[] = []
  ): Promise<string | null> {
    const id = await this.listService.postEntityObject({ name });
    for (const item of items) {
      try {
        await this.addShoppingListItem({ ...item, shopping_list_id: id });
      } catch (error) {
        if (error instanceof RequestError) {
          this.logger.error(await error.response.text());
        }
        throw error;
      }
    }
    return id;
  }

  async addShoppingListItem(item: NewShoppingListItem): Promise<string> {
    return this.itemService.postEntityObject(item);
  }

  /**
   * Returns all shopping list items, optionally filtered by shopping list ID
   * @param id Shopping list ID
   * @returns an array of shopping list items
   */
  async getShoppingListItems(id?: string): Promise<ShoppingListItem[]> {
    const filter = id ? `query[]=shopping_list_id=${id}` : "";
    const rawItems = await this.itemService.getEntityObjects(filter);
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
          title: `${chalk.gray(grocyShortDate(list.row_created_timestamp))} - ${list.name}`,
          value: list.id,
        })),
        { title: "Exit", value: null },
      ],
    });
    return choice.listId as string | null;
  }
}
