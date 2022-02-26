import { FoodstuffsCartProduct } from "@grocy-trolley/store/foodstuffs";
import { Logger } from "@grocy-trolley/utils/logger";
import { Response } from "node-fetch";
import { setTimeout } from "timers/promises";
import { CreatedObjectResponse, CreatedUserObject } from ".";
import { components } from "./api";
import { GrocyBoolean } from "./grocy-model";
import { GrocyRestService } from "./grocy-rest-service";

export class GrocyProductService extends GrocyRestService {
  protected readonly logger = new Logger(this.constructor.name);

  async getProducts(): Promise<Product[]> {
    return this.getEntities<"Product">("products");
  }

  async getProductsWithParsedUserfields(): Promise<SerializedProduct[]> {
    const products = await this.getProducts();
    return products.map((product) => this.parseUserFields(product));
  }

  parseUserFields(product: Product): SerializedProduct {
    const storeMetadata = JSON.parse(product.userfields.storeMetadata);
    return {
      ...product,
      userfields: {
        storeMetadata,
      },
    } as SerializedProduct;
  }

  async createProduct(product: NewProduct): Promise<CreatedObjectResponse> {
    const { userfields, ...coreProduct } = product;
    const postResponse: CreatedUserObject = await this.postForJson(
      this.buildUrl("objects/products"),
      this.authHeaders().acceptJson().contentTypeJson().build(),
      coreProduct
    );
    const objectId = postResponse.created_object_id;
    const response = await this.put(
      this.buildUrl(`userfields/products/${objectId}`),
      this.authHeaders().contentTypeJson().build(),
      userfields
    );
    return { response, objectId };
  }

  async deleteAllProducts() {
    this.logger.warn("DELETING ALL PRODUCTS IN FIVE SECONDS");
    await setTimeout(5000);
    const products = await this.getProducts();
    for (const product of products) {
      await this.deleteProduct(product.id as number);
    }
  }

  async deleteProduct(id: number): Promise<Response> {
    return this.delete(this.buildUrl(`objects/products/${id}`), this.authHeaders().build());
  }

  // async addParentProduct() {}
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
  userfields?: {
    storeMetadata: string;
  };
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

/**
 * storeMetadata userfield once parsed.
 */
export interface StoreMetadata {
  "PAK'n'SAVE"?: FoodstuffsCartProduct;
}

export interface SerializedProduct {
  id: number;
  name: string;
  description: string;
  location_id: number;
  qu_id_purchase: number;
  qu_id_stock: number;
  enable_tare_weight_handling: number;
  not_check_stock_fulfillment_for_recipes: number;
  product_group_id: number;
  qu_factor_purchase_to_stock: number;
  tare_weight?: number;
  /** @description Can contain multiple barcodes separated by comma */
  barcode?: string;
  min_stock_amount?: number;
  default_best_before_days?: number;
  default_best_before_days_after_open?: number;
  picture_file_name?: string;
  row_created_timestamp: string;
  shopping_location_id: number;
  userfields: {
    storeMetadata: StoreMetadata;
  };
}
