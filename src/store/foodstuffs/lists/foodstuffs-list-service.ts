import { uniqueByProperty } from "@gt/utils/arrays";
import { Logger, prettyPrint } from "@gt/utils/logger";
import prompts from "prompts";
import { FoodstuffsBaseProduct, PAKNSAVE_URL } from "../models";
import { FoodstuffsRestService } from "../rest/foodstuffs-rest-service";
import { FoodstuffsUserAgent } from "../rest/foodstuffs-user-agent";
import { List, ListProductRef, ListUpdate, toListProductRef } from "./foodstuffs-list.model";

export class FoodstuffsListService extends FoodstuffsRestService {
  protected readonly baseUrl = this.validateBaseUrl(`${PAKNSAVE_URL}/CommonApi`);
  protected readonly logger = new Logger(this.constructor.name);
  constructor(userAgent: FoodstuffsUserAgent) {
    super(userAgent);
  }

  async createList(name: string): Promise<List> {
    const headersBuilder = await this.authHeaders();
    return this.putForJson(
      this.buildUrl("ShoppingLists/CreateList", { name }),
      headersBuilder.acceptJson().build()
    );
  }

  async createListWithNamePrompt(): Promise<List> {
    const input = await prompts([
      {
        name: "name",
        message: "Enter a name for your new list:",
        type: "text",
      },
    ]);
    return this.createList(input.name as string);
  }

  async getLists(): Promise<List[]> {
    const headersBuilder = await this.authHeaders();
    return this.getForJson<{ lists: List[] }>(
      this.buildUrl("ShoppingLists/GetLists"),
      headersBuilder.acceptJson().build()
    ).then((res) => res.lists);
  }

  async getList(id: string): Promise<List> {
    const headersBuilder = await this.authHeaders();
    return this.getForJson(
      this.buildUrl("ShoppingLists/GetList", { id }),
      headersBuilder.acceptJson().build()
    );
  }

  async selectList(): Promise<string> {
    const lists = await this.getLists();
    const response = await prompts([
      {
        name: "listId",
        message: "Select list",
        type: "select",
        choices: [
          { title: "Create new list", value: null },
          ...lists.map((list) => ({ title: list.name, value: list.listId })),
        ],
      },
    ]);
    if (response.listId !== null) {
      return response.listId as string;
    }
    return this.createListWithNamePrompt().then((list) => list.listId);
  }

  async updateList(listUpdate: ListUpdate): Promise<Omit<List, "name">> {
    const headersBuilder = await this.authHeaders();
    return this.postForJson(
      this.buildUrl("ShoppingLists/UpdateList"),
      headersBuilder.contentTypeJson().acceptJson().build(),
      listUpdate
    );
  }

  async deleteList(id: string | number): Promise<Response> {
    const headersBuilder = await this.authHeaders();
    return this.delete(this.buildUrl(`ShoppingLists/DeleteList/${id}`), headersBuilder.build());
  }

  async createListWithProducts(name: string, products: ListProductRef[]): Promise<List> {
    const createdList = await this.createList(name);
    return this.addProductsToList(createdList.listId, products);
  }

  // TODO #55 Need to use full product, not ref
  async addProductsToList(listId: string, productsToAdd: ListProductRef[]): Promise<List> {
    const list = await this.getList(listId);
    const existingProducts = list.products;
    const products = uniqueByProperty(
      existingProducts.map(toListProductRef).concat(productsToAdd.map(this.formatProductRef)),
      "productId"
    );
    return this.updateList({ listId, products }) as Promise<List>;
  }

  private formatProductRef(product: ListProductRef): ListProductRef {
    const { saleType: sale_type, ...remainder } = product;
    return toListProductRef({ ...remainder, sale_type } as FoodstuffsBaseProduct);
  }

  private async addProductsToListIndividually(
    listId: string,
    products: ListProductRef[]
  ): Promise<List> {
    for (const product of products) {
      this.logger.debug("Adding product " + product.productId);
      try {
        // TODO: fix
        await this.updateList({ listId, products: products as any });
      } catch (error) {
        this.logger.error("Failed to add product to list!\n" + prettyPrint(product));
        this.logger.error(error);
        const response = await prompts([
          { name: "resume", type: "confirm", message: "Resume adding products?" },
        ]);
        if (!response.resume) {
          throw error;
        }
      }
    }
    return this.getList(listId);
  }

  async refreshProductPrices<T extends FoodstuffsBaseProduct>(products: T[]) {
    const list = await this.createListWithProducts(
      `[temporary] price refresh - ${new Date().toISOString()}`,
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

  async deleteTemporaryLists(lists?: List[]): Promise<Response[]> {
    if (!lists) {
      lists = await this.getLists();
    }
    return Promise.all(
      lists
        .filter((list) => list.name.toLowerCase().includes("temporary"))
        .map((list) => this.deleteList(list.listId))
    );
  }
}
