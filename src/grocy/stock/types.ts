import { components, paths } from "../api";
import { GrocySchemas } from "../types/grocy-types";

export type StockAction = "add" | "consume" | "transfer" | "inventory" | "open";

type StockSchemas<A extends StockAction> = paths[`/stock/products/{productId}/${A}`];

export type StockActionRequestBody<A extends StockAction> =
  StockSchemas<A>["post"]["requestBody"]["content"]["application/json"];

export type StockLogEntry = GrocySchemas["StockLogEntry"];

export interface StockAddRequest {
  /**
   * The amount to add - please note that when tare weight handling for the
   * product is enabled, this needs to be the amount including the container
   * weight (gross), the amount to be posted will be automatically calculated
   * based on what is in stock and the defined tare weight
   */
  amount?: number;
  /**
   * The due date of the product to add, when omitted, the current date is used
   */
  best_before_date?: string;
  transaction_type?: components["schemas"]["StockTransactionType"];
  /** The price per stock quantity unit in configured currency */
  price?: number;
  /** If omitted, the default location of the product is used */
  location_id?: string;
  /** If omitted, no store will be affected */
  shopping_location_id?: string;
  /** `1` = No label, `2` = Single label, `3` = Label per unit */
  stock_label_type?: "1" | "2" | "3";
}
