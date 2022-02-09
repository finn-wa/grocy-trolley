import fetch from "node-fetch";
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

  constructor(private readonly baseUrl: string, private readonly apiKey: string) {
    this.headers = {
      "GROCY-API-KEY": this.apiKey,
      Accept: "application/json",
    };
    this.url = this.baseUrl + "/objects/products";
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
    const url = `${this.baseUrl}/objects/${entity}`;
    const response = await fetch(url, { headers: this.headers, method: "get" });
    return response.json();
  }
}

export interface CreateGrocyProduct {
  /** Product name */
  name: string;
  /** HTML formatted description */
  description: string;
  /** Location ID, e.g. ID for Kitchen Pantry */
  location_id: number;
  /** Quantity unit ID for purchases */
  qu_id_purchase: number;
  /** Quantity unit ID for stock  */
  qu_id_stock: number;
  /** Default size in units of purchase, e.g. 400 for 400g */
  qu_factor_purchase_to_stock: number;
  /** Product category, e.g. ID for Fruit */
  product_group_id?: number;
  /** Shopping location, e.g. ID for PAK'n'SAVE Royal Oak */
  shopping_location_id?: number;
  /** Can contain multiple barcodes separated by comma */
  barcode?: string;
  /** Disable stock fulfillment checking for this ingredient */
  not_check_stock_fulfillment_for_recipes?: number;
  /** Enter total weight of stock on purchase */
  enable_tare_weight_handling?: number;
  /** Tare weight */
  tare_weight?: number;
  /** Minimum stock amount */
  min_stock_amount?: number;
  default_best_before_days?: number;
  default_best_before_days_after_open?: number;
  picture_file_name?: string;
  /** Key/value pairs of userfields */
  userfields?: Record<string, string | number>;
  active?: "1";
  calories?: "0";
  cumulate_min_stock_amount_of_sub_products?: "0";
  default_best_before_days_after_freezing?: "0";
  default_best_before_days_after_thawing?: "0";
  due_type?: "1";
  hide_on_stock_overview?: "0";
  parent_product_id?: "2";
  quick_consume_amount?: "1";
  should_not_be_frozen?: "0";
}
