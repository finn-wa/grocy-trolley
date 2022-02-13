import { postForJson } from "@grocy-trolley/utils/fetch-utils";
import { components } from "./api";
import { GrocyBoolean } from "./grocy-model";
import { GrocyRestService } from "./grocy-rest-service";

export class GrocyProductService extends GrocyRestService {
  constructor(apiKey: string, readonly baseUrl: string) {
    super(apiKey);
  }

  async getProducts(): Promise<Product[]> {
    return this.getEntities<"Product">("products");
  }

  async createProduct(product: NewProduct): Promise<Product> {
    return postForJson(
      this.buildUrl("objects/products"),
      this.authHeaders().acceptJson().contentTypeJson().build(),
      product
    );
  }
}

export type Product = components["schemas"]["Product"];

export interface NewProduct {
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
  active?: GrocyBoolean;
  calories?: GrocyBoolean;
  cumulate_min_stock_amount_of_sub_products?: GrocyBoolean;
  default_best_before_days_after_freezing?: GrocyBoolean;
  default_best_before_days_after_thawing?: GrocyBoolean;
  due_type?: GrocyBoolean;
  hide_on_stock_overview?: GrocyBoolean;
  parent_product_id?: GrocyBoolean;
  quick_consume_amount?: GrocyBoolean;
  should_not_be_frozen?: GrocyBoolean;
}
