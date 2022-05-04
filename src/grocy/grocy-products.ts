import { ConversionWithoutId } from "@gt/store/foodstuffs/product-importer/product-converter";
import { FoodstuffsCartProduct, FoodstuffsListProduct } from "@gt/store/foodstuffs";
import { Logger } from "@gt/utils/logger";
import { components } from "./api";
import { CreatedObjectId, GrocyBoolean, QuantityUnitConversion } from "./grocy-model";
import { GrocyRestService } from "./grocy-rest-service";

export class GrocyProductService extends GrocyRestService {
  protected readonly logger = new Logger(this.constructor.name);

  /**
   * Gets all products.
   * @returns An array of products
   */
  async getProducts(): Promise<Product[]> {
    const products = await this.getEntities<"Product">("products");
    return products.map((product) => this.deserialiseProductUserfields(product));
  }

  /**
   * Gets the specified product.
   * @param id Grocy product ID
   * @returns The product
   */
  async getProduct(id: string | number): Promise<Product> {
    const product = await this.getEntity<"Product">("products", id);
    return this.deserialiseProductUserfields(product);
  }

  /**
   * Creates a new product.
   * @param product The product to create
   * @param quConversions QU conversion overrides for the product
   * @returns The API response
   */
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
        this.createQuantityUnitConversion({ ...conversion, product_id: id }).catch(() => ({
          created_object_id: "-1",
        }))
      )
    );
    const quConversionIds = quConversionResponses.map((res) => res.created_object_id);
    return { id, userfieldsResponse, quConversionIds };
  }

  async createQuantityUnitConversion(conversion: QuantityUnitConversion): Promise<CreatedObjectId> {
    return this.createEntity("quantity_unit_conversions", conversion);
  }

  /**
   * [UNTESTED] Patches a product.
   * @param id Grocy product ID
   * @param patch Values to update for the product
   * @returns The patch API responses
   */
  async patchProduct(
    id: number | string,
    patch: Partial<Product>
  ): Promise<ProductUpdateResponses> {
    const responses: ProductUpdateResponses = {};
    const { userfields: userfieldsPatch, ...productPatch } = patch;
    if (userfieldsPatch) {
      const existingUserfields = await this.getProductUserfields(id);
      const updatedUserfields = { ...existingUserfields, ...userfieldsPatch };
      responses.userfields = await this.updateProductUserfields(id, updatedUserfields);
    }
    if (productPatch) {
      const existingProduct = await this.getEntity<"Product">("products", id);
      const update = { ...existingProduct, ...productPatch };
      responses.coreProduct = await this.updateEntity("products", id, update);
    }
    return responses;
  }

  /**
   * [UNTESTED] Updates a product.
   * @param id Grocy product ID
   * @param product New product
   * @returns The API responses for update operations
   */
  async updateProduct(id: number | string, product: Product): Promise<ProductUpdateResponses> {
    const responses: { userfields?: Response; productPatch?: Response } = {};
    const { userfields, ...coreProduct } = product;
    if (userfields) {
      responses.userfields = await this.updateProductUserfields(id, userfields);
    }
    if (coreProduct) {
      responses.productPatch = await this.updateEntity("products", id, coreProduct);
    }
    return responses;
  }

  /**
   * Deletes a product.
   * @param id Grocy product ID
   * @returns API response
   */
  async deleteProduct(id: number): Promise<Response> {
    return this.delete(this.buildUrl(`objects/products/${id}`), this.authHeaders().build());
  }

  private deserialiseProductUserfields(product: UnparsedProduct): Product {
    return {
      ...product,
      userfields: this.deserialiseUserfields(product.userfields),
    } as Product;
  }

  private deserialiseUserfields(userfields: UnparsedProduct["userfields"]): ProductUserfields {
    const storeMetadata = userfields.storeMetadata
      ? (JSON.parse(userfields.storeMetadata) as ProductUserfields["storeMetadata"])
      : undefined;
    return {
      ...userfields,
      storeMetadata,
    };
  }

  private async getProductUserfields(productId: string | number): Promise<ProductUserfields> {
    const userfields = await this.getForJson<UnparsedProduct["userfields"]>(
      this.buildUrl(`userfields/products/${productId}`),
      this.authHeaders().acceptJson().build()
    );
    return this.deserialiseUserfields(userfields);
  }

  private async updateProductUserfields(
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
}

interface ProductUpdateResponses {
  userfields?: Response;
  coreProduct?: Response;
}

export type UnparsedProduct = components["schemas"]["Product"];

export interface ProductUserfields {
  storeMetadata?: {
    PNS?: FoodstuffsCartProduct | FoodstuffsListProduct;
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

export interface Product {
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

export interface CreatedProductResponse {
  id: string;
  userfieldsResponse: Response;
  quConversionIds: string[];
}
