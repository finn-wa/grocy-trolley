import fetch from "node-fetch";
import { components, paths } from "../../openapi/grocy";
import { Env } from "../../resources/env";

type EntityGetApi = paths["/objects/{entity}"]["get"]["responses"];
type Product = components["schemas"]["Product"];

export class GrocyStore {
  private readonly url: string;
  private readonly headers: Record<string, string>;

  constructor(private readonly env: Env) {
    this.headers = {
      "GROCY-API-KEY": this.env.grocyApiKey,
      Accept: "application/json",
    };
    this.url = this.env.grocyUrl + "/objects/products";
  }

  async getProducts(): Promise<Product[]> {
    const response = await fetch(this.url, { headers: this.headers, method: "get" });
    return response.json();
  }

  async createProduct(product: Product): Promise<void> {
    const response = await fetch(this.url, {
      headers: {
        ...this.headers,
        "Content-Type": "application/json",
      },
      method: "post",
      body: JSON.stringify(product),
    });
    return response.json();
  }
}
