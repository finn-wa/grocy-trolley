import { ConversionWithoutId } from "@grocy-trolley/store/foodstuffs/product-importer/product-converter";
import { Response } from "node-fetch";
import { FoodstuffsCartProduct, FoodstuffsCategory } from "store/foodstuffs";
import { Logger } from "utils/logger";
import { components } from "./api";
import { CreatedObjectId, GrocyBoolean, QuantityUnitConversion, toBoolean } from "./grocy-model";
import { GrocyRestService } from "./grocy-rest-service";
import { CreatedObjectResponse } from "./grocy-user-entities";

export class GrocyProductService extends GrocyRestService {
  protected readonly logger = new Logger(this.constructor.name);

  async getProducts(): Promise<Product[]> {
    return this.getEntities<"Product">("products");
  }

  async getProductsWithParsedUserfields(): Promise<SerializedProduct[]> {
    const products = await this.getProducts();
    return products.map((product) => this.deserialiseProductUserfields(product));
  }

  async getProduct(id: string | number): Promise<Product> {
    return this.getEntity<"Product">("products", id);
  }

  async getProductWithParsedUserfields(id: string | number): Promise<SerializedProduct> {
    const product = await this.getProduct(id);
    return this.deserialiseProductUserfields(product);
  }

  async getParentProducts(products?: SerializedProduct[]): Promise<Record<string, ParentProduct>> {
    if (!products) {
      products = await this.getProductsWithParsedUserfields();
    }
    const parents: Record<string, ParentProduct> = Object.fromEntries(
      products
        .filter((product) => toBoolean(product.userfields.isParent))
        .map((product) => {
          const category = product.userfields.storeMetadata?.PNS?.categoryName ?? "Other";
          const tags = product.name.replace("(Generic)", "").trim().split(" ");
          const parent = { product, category, tags, children: [] };
          return [product.id, parent];
        })
    );
    products.forEach((product) => {
      const parent = parents[product.parent_product_id as string];
      if (parent) {
        parent.children.push(product);
      }
    });
    return parents;
  }

  async getProductsByFoodstuffsId(): Promise<Record<string, SerializedProduct>> {
    const existingProducts = await this.getProductsWithParsedUserfields();
    return Object.fromEntries(
      existingProducts
        .filter((p) => p.userfields?.storeMetadata?.PNS)
        .map((product) => [product.userfields.storeMetadata?.PNS?.productId, product])
    );
  }

  deserialiseProductUserfields(product: Product): SerializedProduct {
    return {
      ...product,
      userfields: this.deserialiseUserfields(product.userfields),
    } as SerializedProduct;
  }

  deserialiseUserfields(userfields: Product["userfields"]): ProductUserfields {
    const storeMetadata = userfields.storeMetadata
      ? JSON.parse(userfields.storeMetadata)
      : undefined;
    return {
      ...userfields,
      storeMetadata,
    };
  }

  async createProduct(
    product: NewProduct,
    quConversions?: ConversionWithoutId[]
  ): Promise<CreatedProductResponse> {
    const { userfields, ...coreProduct } = product;
    const productResponse = await this.createEntity("products", coreProduct);
    const id = productResponse.created_object_id;
    const userfieldsResponse = await this.put(
      this.buildUrl(`userfields/products/${id}`),
      this.authHeaders().contentTypeJson().build(),
      userfields
    );
    if (!quConversions || quConversions.length === 0) {
      return { id, userfieldsResponse, quConversionIds: [] };
    }
    const quConversionResponses: CreatedObjectId[] = await Promise.all(
      quConversions.map((conversion) =>
        this.createQuantityUnitConversion({ ...conversion, product_id: id })
      )
    );
    const quConversionIds = quConversionResponses.map((res) => res.created_object_id);
    return { id, userfieldsResponse, quConversionIds };
  }

  async createQuantityUnitConversion(conversion: QuantityUnitConversion): Promise<CreatedObjectId> {
    return this.createEntity("quantity_unit_conversions", conversion);
  }

  async updateProduct(product: Product): Promise<Response> {
    return this.updateEntity("products", product.id as number, product);
  }

  async getProductUserfields(productId: string | number): Promise<ProductUserfields> {
    const userfields = await this.getForJson<Product["userfields"]>(
      this.buildUrl(`userfields/products/${productId}`),
      this.authHeaders().acceptJson().build()
    );
    return this.deserialiseUserfields(userfields);
  }

  async updateProductUserfields(
    productId: string | number,
    userfields: ProductUserfields
  ): Promise<Response> {
    const serialisedUserfields = {
      ...userfields,
      storeMetadata: JSON.stringify(userfields.storeMetadata),
    };
    return this.put(
      this.buildUrl(`userfields/products/${productId}`),
      this.authHeaders().contentTypeJson().build(),
      serialisedUserfields
    );
  }

  async deleteProduct(id: number): Promise<Response> {
    return this.delete(this.buildUrl(`objects/products/${id}`), this.authHeaders().build());
  }

  // async get
}

export type Product = components["schemas"]["Product"];

export interface ProductUserfields {
  storeMetadata?: {
    PNS?: FoodstuffsCartProduct;
    receiptNames?: string[];
  };
  isParent?: GrocyBoolean;
}

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
  userfields: {
    storeMetadata: string;
    isParent: GrocyBoolean;
  };
  active?: GrocyBoolean;
  calories?: GrocyBoolean;
  cumulate_min_stock_amount_of_sub_products?: GrocyBoolean;
  default_best_before_days_after_freezing?: GrocyBoolean;
  default_best_before_days_after_thawing?: GrocyBoolean;
  due_type?: GrocyBoolean;
  hide_on_stock_overview?: GrocyBoolean;
  parent_product_id?: number;
  quick_consume_amount?: number;
  should_not_be_frozen?: GrocyBoolean;
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
  parent_product_id?: string | number | null;
  userfields: ProductUserfields;
}

export interface ParentProduct {
  tags: string[];
  category: FoodstuffsCategory;
  product: SerializedProduct;
  children: SerializedProduct[];
}

export interface CreatedProductResponse {
  id: string;
  userfieldsResponse: Response;
  quConversionIds: string[];
}
