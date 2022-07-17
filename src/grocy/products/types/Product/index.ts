import {
  GrocyBoolean,
  parseBoolean,
  parseIfDefined,
  updateTypes,
} from "@gt/grocy/types/grocy-types";
import { FoodstuffsCartProduct, FoodstuffsListProduct } from "@gt/store/foodstuffs/models";

export interface RawProductUserfields {
  isParent: GrocyBoolean;
  storeMetadata: string | null;
}

export interface RawProduct {
  active: string;
  calories: string | null;
  cumulate_min_stock_amount_of_sub_products: string;
  default_best_before_days: string;
  default_best_before_days_after_freezing: string;
  default_best_before_days_after_open: string;
  default_best_before_days_after_thawing: string;
  default_consume_location_id: string | null;
  default_stock_label_type: string;
  description: string;
  due_type: string;
  enable_tare_weight_handling: string;
  hide_on_stock_overview: string;
  id: string;
  location_id: string;
  min_stock_amount: string;
  name: string;
  no_own_stock: string;
  not_check_stock_fulfillment_for_recipes: string;
  parent_product_id: string | null;
  picture_file_name: string | null;
  product_group_id: string;
  qu_factor_purchase_to_stock: string;
  qu_id_purchase: string;
  qu_id_stock: string;
  quick_consume_amount: string;
  row_created_timestamp: string;
  shopping_location_id: string | null;
  should_not_be_frozen: string;
  tare_weight: string;
  treat_opened_as_out_of_stock: string;
  userfields: RawProductUserfields;
}

export interface ProductUserfields {
  storeMetadata: {
    PNS?: FoodstuffsCartProduct | FoodstuffsListProduct;
    receiptNames?: string[];
  } | null;
  isParent: boolean | null;
}

export function parseProductUserfields(userfields: RawProductUserfields): ProductUserfields {
  const storeMetadata = parseIfDefined(userfields.storeMetadata, JSON.parse) as
    | ProductUserfields["storeMetadata"]
    | null;
  return {
    ...userfields,
    storeMetadata,
    isParent: parseBoolean(userfields.isParent),
  };
}

export function serialiseProductUserfields(userfields: ProductUserfields): RawProductUserfields {
  return {
    ...userfields,
    storeMetadata: userfields.storeMetadata ? JSON.stringify(userfields.storeMetadata) : null,
    isParent: userfields.isParent ? "1" : "0",
  };
}

/**
 * New products don't need to include every field.
 */
export interface NewProduct {
  /** HTML formatted description */
  description: string;
  /** Location ID, e.g. ID for Kitchen Pantry */
  location_id: string;
  /** Product name */
  name: string;
  /** Default size in units of purchase, e.g. 400 for 400g */
  qu_factor_purchase_to_stock: number;
  /** Quantity unit ID for purchases */
  qu_id_purchase: string;
  qu_id_stock: string;

  // Optional fields
  active?: boolean;
  /** Can contain multiple barcodes separated by comma. Not returned for getProducts?  */
  barcode?: string;
  calories?: number | null;
  cumulate_min_stock_amount_of_sub_products?: boolean;
  default_best_before_days?: number;
  default_best_before_days_after_freezing?: number;
  default_best_before_days_after_open?: number;
  default_best_before_days_after_thawing?: number;
  default_consume_location_id?: string | null;
  default_stock_label_type?: number;
  /** 0 for expiration date, 1 for best before date*/
  due_type?: number;
  enable_tare_weight_handling?: boolean;
  hide_on_stock_overview?: boolean;
  min_stock_amount?: number;
  no_own_stock?: boolean;
  not_check_stock_fulfillment_for_recipes?: boolean;
  parent_product_id?: string | null;
  picture_file_name?: string | null;
  /** Product category, e.g. ID for Fruit */
  product_group_id?: string;
  quick_consume_amount?: number;
  /** Shopping location, e.g. ID for PAK'n'SAVE Royal Oak */
  shopping_location_id?: string | null;
  should_not_be_frozen?: boolean;
  tare_weight?: number;
  treat_opened_as_out_of_stock?: boolean;
  userfields?: ProductUserfields;
}

export interface Product {
  active: boolean;
  /** Can contain multiple barcodes separated by comma. Not returned for get requests but can be posted/putted */
  barcode?: string;
  calories: number | null;
  cumulate_min_stock_amount_of_sub_products: boolean;
  default_best_before_days: number;
  default_best_before_days_after_freezing: number;
  default_best_before_days_after_open: number;
  default_best_before_days_after_thawing: number;
  default_consume_location_id: string | null;
  default_stock_label_type: number;
  /** HTML formatted description */
  description: string;
  /** 0 for expiration date, 1 for best before date*/
  due_type: number;
  enable_tare_weight_handling: boolean;
  hide_on_stock_overview: boolean;
  id: string;
  /** Location ID, e.g. ID for Kitchen Pantry */
  location_id: string;
  min_stock_amount: number;
  /** Product name */
  name: string;
  no_own_stock: boolean;
  not_check_stock_fulfillment_for_recipes: boolean;
  parent_product_id: string | null;
  picture_file_name: string | null;
  /** Product category, e.g. ID for Fruit */
  product_group_id: string;
  /** Default size in units of purchase, e.g. 400 for 400g */
  qu_factor_purchase_to_stock: number;
  /** Quantity unit ID for purchases */
  qu_id_purchase: string;
  qu_id_stock: string;
  quick_consume_amount: number;
  row_created_timestamp: string;
  /** Shopping location, e.g. ID for PAK'n'SAVE Royal Oak */
  shopping_location_id: string | null;
  should_not_be_frozen: boolean;
  tare_weight: number;
  treat_opened_as_out_of_stock: boolean;
  userfields: ProductUserfields;
}

export function parseProduct(raw: RawProduct): Product {
  return updateTypes(
    { ...raw, userfields: parseProductUserfields(raw.userfields) },
    {
      booleans: [
        "active",
        "cumulate_min_stock_amount_of_sub_products",
        "enable_tare_weight_handling",
        "hide_on_stock_overview",
        "no_own_stock",
        "not_check_stock_fulfillment_for_recipes",
        "should_not_be_frozen",
        "treat_opened_as_out_of_stock",
      ],
      numbers: [
        "calories",
        "default_best_before_days",
        "default_best_before_days_after_freezing",
        "default_best_before_days_after_open",
        "default_best_before_days_after_thawing",
        "default_stock_label_type",
        "due_type",
        "min_stock_amount",
        "qu_factor_purchase_to_stock",
        "quick_consume_amount",
        "tare_weight",
      ],
      optionalIds: ["shopping_location_id", "default_consume_location_id", "parent_product_id"],
    }
  );
}
