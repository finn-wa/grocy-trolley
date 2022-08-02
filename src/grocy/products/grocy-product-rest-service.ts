import { Logger } from "@gt/utils/logger";
import { GrocyEntityService } from "../rest/grocy-entity-rest-service";
import { QuantityUnitConversion } from "../types/grocy-types";
import {
  NewProduct,
  parseProduct,
  parseProductUserfields,
  Product,
  ProductUserfields,
  RawProductUserfields,
  serialiseProductUserfields,
} from "./types/Product";
import { getRawProductSchema, getRawProductsSchema } from "./types/Product/schema";
import { RequestError } from "@gt/utils/rest";

/**
 * Contains methods for plain REST operations on Grocy Product entities and
 * their userfields. See GrocyProductService for a higher-level Product API.
 */
export class GrocyProductRestService extends GrocyEntityService {
  protected readonly logger = new Logger(this.constructor.name);

  /**
   * Gets all products.
   * @returns An array of products
   */
  async getProducts(): Promise<Product[]> {
    const rawProducts = await this.getEntityObjects("products", getRawProductsSchema());
    return rawProducts.map(parseProduct);
  }

  /**
   * Gets the specified product.
   * @param id Grocy product ID
   * @returns The product
   */
  async getProduct(id: string): Promise<Product> {
    const rawProduct = await this.getEntityObject("products", id, getRawProductSchema());
    return parseProduct(rawProduct);
  }

  /**
   * Creates a product.
   * @param product The product to create. Minus userfields and the ID.
   * @returns The ID of the newly created product
   */
  async postProduct(product: Omit<NewProduct, "userfields">): Promise<string> {
    return this.postEntityObject("products", product);
  }

  /**
   * Deletes a product.
   * @param id Grocy product ID
   * @returns API response
   */
  async deleteProduct(id: string): Promise<Response> {
    return this.deleteEntityObject("products", id);
  }

  /**
   * Creates a new quantity unit conversion.
   * @param conversion the conversion to create
   * @returns The created object ID or null if it already exists
   */
  async createQuantityUnitConversion(conversion: QuantityUnitConversion): Promise<string | null> {
    try {
      return this.postEntityObject("quantity_unit_conversions", conversion);
    } catch (error) {
      if (error instanceof RequestError) {
        const response = error.response;
        if (response.status === 400 && (await response.text()).includes("SQLSTATE[23000]")) {
          return null; // the conversion already exists
        }
      }
      throw error;
    }
  }

  async putProduct(id: string, product: Omit<Product, "userfields">): Promise<Response> {
    return this.put(this.buildUrl(`/objects/products/${id}`), {
      headers: this.authHeaders().acceptJson().contentTypeJson().build(),
      body: JSON.stringify(product),
    });
  }

  async putProductUserfields(productId: string, userfields: ProductUserfields): Promise<Response> {
    return this.put(this.buildUrl(`/userfields/products/${productId}`), {
      headers: this.authHeaders().contentTypeJson().build(),
      body: JSON.stringify(serialiseProductUserfields(userfields)),
    });
  }

  /**
   * Returns userfields for the given product ID. Note that userfields are
   * included in the response of getProduct.
   *
   * @param productId the product ID
   * @returns the userfields
   */
  async getProductUserfields(productId: string): Promise<ProductUserfields> {
    const userfields = await this.getAndParse<RawProductUserfields>(
      this.buildUrl(`userfields/products/${productId}`),
      { headers: this.authHeaders().acceptJson().build() }
    );
    return parseProductUserfields(userfields);
  }
}
