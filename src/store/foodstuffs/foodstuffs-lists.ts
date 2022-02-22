import { getForJson, putForJson } from "@grocy-trolley/utils/fetch-utils";
import {
  FoodstuffsAuthService,
  FoodstuffsBaseProduct,
  FoodstuffsListProduct,
  ProductsSnapshot,
  SaleTypeString,
} from ".";
import { FoodstuffsRestService } from "./foodstuffs-rest-service";

export class FoodstuffsListService extends FoodstuffsRestService {
  constructor(authService: FoodstuffsAuthService) {
    super(authService);
  }

  async createList(name: string): Promise<List> {
    return putForJson(
      this.buildUrl("ShoppingLists/CreateList", { name }),
      this.authHeaders().acceptJson().build()
    );
  }

  async getLists(): Promise<List[]> {
    return getForJson<{ lists: List[] }>(
      this.buildUrl("ShoppingLists/GetLists"),
      this.authHeaders().acceptJson().build()
    ).then((res) => res.lists);
  }

  async getList(id: string): Promise<List> {
    return getForJson(
      this.buildUrl("ShoppingLists/GetList", { id }),
      this.authHeaders().acceptJson().build()
    );
  }

  async updateList(listUpdate: ListUpdate): Promise<List> {
    return putForJson(
      this.buildUrl("ShoppingLists/UpdateList"),
      this.authHeaders().contentTypeJson().acceptJson().build(),
      listUpdate
    );
  }

  async createListWithProducts(name: string, products: ListProductRef[]): Promise<List> {
    const createdList = await this.createList(name);
    return this.updateList({
      listId: createdList.listId,
      Name: name,
      products,
    });
  }
}

export interface ListProductRef {
  productId: string;
  quantity: number;
  saleType: SaleTypeString;
}

export interface ListUpdate {
  listId: string;
  products: ListProductRef[];
  Name: string;
}

export interface List {
  listId: string;
  products: FoodstuffsListProduct[];
  name: string;
}

export function toListProductRef(product: FoodstuffsBaseProduct): ListProductRef {
  return {
    productId: product.productId,
    quantity: product.quantity,
    saleType: product.sale_type,
  };
}

export function snapshotToListProductRefs(products: ProductsSnapshot) {
  return [...products.unavailableProducts, ...products.products].map((product) =>
    toListProductRef(product)
  );
}
