import fetch from "node-fetch";
import { Env } from "env";
import { components } from "./api";

type Schemas = components["schemas"];
export type Product = Schemas["Product"];
export type Location = Schemas["Location"];
export type ShoppingLocation = Schemas["ShoppingLocation"];
export type QuantityUnit = Schemas["QuantityUnit"];

export const QUANTITY_UNITS = ["piece", "pack", "g", "kg", "mL", "L"] as const;
type QuantityUnitName = typeof QUANTITY_UNITS[number];

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

  async getQuantityUnitIds(): Promise<Record<QuantityUnitName, number>> {
    const quantityUnits = await this.getQuantityUnits();
    const storedUnitNames = quantityUnits.map((unit) => unit.name);
    const missingUnits = QUANTITY_UNITS.filter((unit) => !storedUnitNames.includes(unit));
    if (missingUnits.length > 0) {
      throw new Error(`The following units are missing from grocy: '${missingUnits.join(", ")}'`);
    }
    return Object.fromEntries(quantityUnits.map((unit) => [unit.name, unit.id]));
  }

  async getProducts(): Promise<Product[]> {
    return this.getEntities<"Product">("products");
  }

  async getQuantityUnits(): Promise<QuantityUnit[]> {
    return this.getEntities<"QuantityUnit">("quantity_units");
  }

  async getStoreLocations(): Promise<ShoppingLocation[]> {
    return this.getEntities<"ShoppingLocation">("shopping_locations");
  }

  async getLocations(): Promise<Location[]> {
    return this.getEntities<"Location">("locations");
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

  private async getEntities<K extends keyof Schemas>(
    entity: Schemas["ExposedEntity"]
  ): Promise<Schemas[K][]> {
    const url = `${this.env.grocyUrl}/objects/${entity}`;
    const response = await fetch(url, { headers: this.headers, method: "get" });
    return response.json();
  }
}
