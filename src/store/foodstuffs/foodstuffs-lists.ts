import { Logger, prettyPrint } from "@gt/utils/logger";
import prompts from "prompts";
import {
  FoodstuffsBaseProduct,
  FoodstuffsListProduct,
  FoodstuffsUserAgent,
  ProductsSnapshot,
  SaleTypeString,
} from ".";
import { PAKNSAVE_URL } from "./foodstuffs.model";
import { FoodstuffsRestService } from "./rest-service/foodstuffs-rest-service";

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

  async updateList(listUpdate: ListUpdate): Promise<List> {
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
    throw new Error("fuck");
    // const products = [];
    // Object.values(
    //   Object.fromEntries([
    //     ...list.products.map((p) => [p.productId, toListProductRef(p)]),
    //     ...productsToAdd.map((p) => [p.productId, p]),
    //   ])
    // ) as ListProductRef[];

    // return this.updateList({ listId, products });
    // try {
    // } catch (error) {
    //   this.logger.error(error);
    //   this.logger.error("Failed to add products to list. Falling back to chunks.");
    // }
    // const iter = products[Symbol.iterator]();
    // let chunk: ListProductRef[];
    // do {
    //   chunk = Array.from(
    //     { length: 5 },
    //     () => iter.next().value as ListProductRef | undefined
    //   ).filter((p): p is ListProductRef => !!p);
    //   try {
    //     await this.updateList({ listId, products: chunk });
    //   } catch (error) {
    //     await this.addProductsToListIndividually(listId, chunk);
    //   }
    // } while (chunk.length === 5);
    return this.getList(listId);
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

export interface ListProductRef {
  productId: string;
  quantity: number;
  saleType: SaleTypeString;
}

export interface ListUpdate {
  listId: string;
  products?: FoodstuffsListProduct[];
  Name?: string;
}

export interface List {
  listId: string;
  products: FoodstuffsListProduct[];
  name: string;
}

export function toListProductRef(product: FoodstuffsBaseProduct): ListProductRef {
  const saleType = product.sale_type === "BOTH" ? "UNITS" : product.sale_type;
  return {
    productId: product.productId,
    quantity: product.quantity,
    saleType,
  };
}

export function snapshotToListProductRefs(products: ProductsSnapshot) {
  return [...products.unavailableProducts, ...products.products].map((product) =>
    toListProductRef(product)
  );
}
