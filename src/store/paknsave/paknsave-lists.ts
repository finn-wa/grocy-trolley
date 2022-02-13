import { Product } from "@grocy-trolley/grocy/grocy";
import { getForJson, putForJson } from "@grocy-trolley/utils/fetch-utils";
import { PakNSaveAuthService, SaleTypeString } from ".";
import { OrderDetails, OrderedProduct } from "./paknsave-orders";
import { PakNSaveRestService } from "./paknsave-rest-service";

export class PakNSaveListsService extends PakNSaveRestService {
  constructor(pnsAuthService: PakNSaveAuthService) {
    super(pnsAuthService);
  }

  async createList(name: string): Promise<List> {
    return putForJson(
      this.buildUrl("ShoppingLists/CreateList", { name }),
      this.authHeaders().acceptJson().build()
    );
  }

  async getLists(): Promise<List[]> {
    return getForJson(
      this.buildUrl("ShoppingLists/GetLists"),
      this.authHeaders().acceptJson().build()
    );
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

  async createListFromOrder(order: OrderDetails): Promise<List> {
    const { orderNumber, timeslot, storeName } = order.summary;
    const name = `Order #${orderNumber} | ${timeslot.date} | ${storeName}`;
    const products: ProductRef[] = [
      ...order.unavailableProducts.map((p) => this.orderedProductToRef(p)),
      ...order.products.map((p) => this.orderedProductToRef(p)),
    ];
    const createdList = await this.createList(name);
    return this.updateList({
      listId: createdList.listId,
      Name: name,
      products,
    });
  }

  private orderedProductToRef(product: OrderedProduct): ProductRef {
    return {
      productId: product.productId,
      quantity: product.quantity,
      saleType: product.sale_type,
    };
  }
}

export interface ProductRef {
  productId: string;
  quantity: number;
  saleType: SaleTypeString;
}

export interface ListUpdate {
  listId: string;
  products: ProductRef[];
  Name: string;
}

export interface List {
  listId: string;
  products: Product[];
  name: string;
}
