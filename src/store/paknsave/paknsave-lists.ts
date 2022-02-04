import fetch from "node-fetch";
import { PAKNSAVE_URL } from "./paknsave.model";
import { buildUrl, extractJson } from "utils/fetch-utils";
import { ProductRef } from "./paknsave-products";
import { Product } from "grocy/grocy";

export class PakNSaveListsService {
  readonly baseUrl = `${PAKNSAVE_URL}/ShoppingLists/`;
  readonly headers: Record<string, string> = { Accept: "application/json" };

  async createList(name: string): Promise<List> {
    const url = buildUrl(this.baseUrl, "CreateList", { name });
    const response = await fetch(url, { headers: this.headers, method: "PUT" });
    return extractJson(response);
  }

  async getLists(): Promise<List[]> {
    const url = buildUrl(this.baseUrl, "GetLists");
    const response = await fetch(url, { headers: this.headers, method: "GET" });
    return extractJson(response);
  }

  async getList(id: string): Promise<List> {
    const url = buildUrl(this.baseUrl, "GetList", { id });
    const response = await fetch(url, { headers: this.headers, method: "GET" });
    return extractJson(response);
  }

  async updateList(listUpdate: ListUpdate): Promise<List> {
    const url = buildUrl(this.baseUrl, "UpdateList");
    const response = await fetch(url, {
      headers: this.headers,
      method: "GET",
      body: JSON.stringify(listUpdate),
    });
    return extractJson(response);
  }
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
