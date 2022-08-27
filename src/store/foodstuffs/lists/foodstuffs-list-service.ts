import { AppTokens } from "@gt/app/di";
import { PromptProvider } from "@gt/prompts/prompt-provider";
import { uniqueByProperty } from "@gt/utils/arrays";
import { Logger } from "@gt/utils/logger";
import { setTimeout } from "timers/promises";
import { inject, Lifecycle, scoped } from "tsyringe";
import { FoodstuffsBaseProduct, PAKNSAVE_URL } from "../models";
import { FoodstuffsAuthHeaderProvider } from "../rest/foodstuffs-auth-header-provider";
import { FoodstuffsRestService } from "../rest/foodstuffs-rest-service";
import {
  formatListProductRef,
  List,
  ListProductRef,
  ListUpdate,
  toListProductRef,
} from "./foodstuffs-list.model";

export const TEMP_LIST_PREFIX = "[temporary]";

@scoped(Lifecycle.ContainerScoped)
export class FoodstuffsListService extends FoodstuffsRestService {
  protected readonly baseUrl = this.validateBaseUrl(`${PAKNSAVE_URL}/CommonApi`);
  protected readonly logger = new Logger(this.constructor.name);

  constructor(
    userAgent: FoodstuffsAuthHeaderProvider,
    @inject(AppTokens.promptProvider) private readonly prompt: PromptProvider
  ) {
    super(userAgent);
  }

  async createList(name: string): Promise<List> {
    const headersBuilder = await this.authHeaders();
    return this.putAndParse(this.buildUrl("ShoppingLists/CreateList", { name }), {
      headers: headersBuilder.acceptJson().build(),
    });
  }

  async createListWithNamePrompt(): Promise<List | null> {
    const name = await this.prompt.text("Enter a name for your new list");
    if (!name) return null;
    return this.createList(name);
  }

  async getLists(): Promise<List[]> {
    const headersBuilder = await this.authHeaders();
    return this.getAndParse<{ lists: List[] }>(this.buildUrl("ShoppingLists/GetLists"), {
      headers: headersBuilder.acceptJson().build(),
    }).then((res) => res.lists);
  }

  async getList(id: string): Promise<List> {
    const headersBuilder = await this.authHeaders();
    return this.getAndParse(this.buildUrl("ShoppingLists/GetList", { id }), {
      headers: headersBuilder.acceptJson().build(),
    });
  }

  /**
   * Prompts to select or create a new list
   * @returns the selected list's ID or null if the user cancelled the prompt
   */
  async promptSelectOrCreateList(): Promise<string | null> {
    const lists = await this.getLists();
    const listId = await this.prompt.select("Select list", [
      { title: "Create new list", value: "createNewList" as const },
      ...lists.map((list) => ({ title: list.name, value: list.listId })),
    ]);
    if (listId === "createNewList") {
      return this.createListWithNamePrompt().then((list) => list?.listId ?? null);
    }
    return listId;
  }

  /**
   * Performs a POST request to update the list with the specified ID. List
   * contents are replaced with the products in the listUpdate. To add products
   * to a list, use {@link addProductsToList}.
   * @param listUpdate Request body containing list ID and new products
   * @returns Updated list
   */
  async updateList(listUpdate: ListUpdate): Promise<Omit<List, "name">> {
    const headersBuilder = await this.authHeaders();
    return this.postAndParse(this.buildUrl("ShoppingLists/UpdateList"), {
      headers: headersBuilder.contentTypeJson().acceptJson().build(),
      body: JSON.stringify(listUpdate),
    });
  }

  async deleteList(id: string | number): Promise<{ lists: Omit<List, "products">[] }> {
    const headersBuilder = await this.authHeaders();
    return this.deleteAndParse(this.buildUrl(`ShoppingLists/DeleteList/${id}`), {
      headers: headersBuilder.acceptJson().build(),
    });
  }

  async createListWithProducts(
    name: string,
    products: ListProductRef[]
  ): Promise<Omit<List, "name">> {
    const createdList = await this.createList(name);
    return this.addProductsToList(createdList.listId, products);
  }

  async addProductsToList(listId: string, productsToAdd: ListProductRef[]): Promise<List> {
    const list = await this.getList(listId);
    const existingProducts = list.products;
    const products = uniqueByProperty(
      [...existingProducts.map(toListProductRef), ...productsToAdd.map(formatListProductRef)],
      "productId"
    );
    return this.updateList({ listId, products }) as Promise<List>;
  }

  async refreshProductPrices<T extends FoodstuffsBaseProduct>(products: T[]) {
    const list = await this.createListWithProducts(
      `${TEMP_LIST_PREFIX} price refresh - ${new Date().toISOString()}`,
      products.map((product) => toListProductRef(product))
    );
    const refreshedProducts = products.map((product) => {
      const listProduct = list.products.find((x) => x.productId === product.productId);
      if (!listProduct) {
        this.logger.warn(
          `Failed to find updated price for product: ${product.productId} / ${product.name}`
        );
        return { ...product };
      }
      return { ...product, price: listProduct?.price };
    });
    await this.deleteList(list.listId);
    return refreshedProducts;
  }

  /**
   * Deletes lists with names matching the supplied pattern.
   * @param namePattern Pattern to match list names
   * @param lists Optional array of lists to search for names in
   * @returns Array of responses to DELETE requests
   */
  async deleteLists(namePattern?: RegExp, lists?: List[]): Promise<Response[]> {
    if (!lists) {
      lists = await this.getLists();
    }
    const headersBuilder = await this.authHeaders();
    const request: RequestInit = { method: "DELETE", headers: headersBuilder.acceptJson().build() };
    const deletionUrls = lists
      .filter((list) => namePattern?.test(list.name) ?? true)
      .map(({ listId }) => this.buildUrl(`ShoppingLists/DeleteList/${listId}`));
    // Promise.all doesn't seem to work well
    const responses = [];
    for (const url of deletionUrls) {
      responses.push(await this.fetch(url, request));
      await setTimeout(250);
    }
    return responses;
  }
}
