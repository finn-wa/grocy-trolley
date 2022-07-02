import { ConversionWithoutId } from "@gt/store/foodstuffs/grocy/import/product-converter";
import { Logger } from "@gt/utils/logger";
import { GrocyProductRestService } from "./grocy-product-rest-service";
import { NewProduct, Product } from "./types/Product";

export const products = "products";

export class GrocyProductService {
  protected readonly logger = new Logger(this.constructor.name);
  private readonly rest = new GrocyProductRestService();

  /**
   * Gets all products.
   * @returns An array of products
   */
  getAllProducts(): Promise<Product[]> {
    return this.rest.getAllProducts();
  }
  /**
   * Gets the specified product.
   * @param id Grocy product ID
   * @returns The product
   */
  getProduct(id: string): Promise<Product> {
    return this.rest.getProduct(id);
  }

  /**
   * Creates a product.
   * @param product The product to create. Minus userfields and the ID.
   * @returns The ID of the newly created product
   */
  deleteProduct(id: string): Promise<Response> {
    return this.rest.deleteProduct(id);
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
    const id = await this.rest.postProduct(coreProduct);
    let userfieldsResponse: Response | undefined = undefined;
    if (userfields && Object.keys(userfields).length > 0) {
      userfieldsResponse = await this.rest.putProductUserfields(id, userfields);
    }
    if (!quConversions || quConversions.length === 0) {
      return { id, userfieldsResponse, quConversionIds: [] };
    }
    const quConversionIds: string[] = await Promise.all(
      quConversions.map((conversion) =>
        this.rest.createQuantityUnitConversion({ ...conversion, product_id: id })
      )
    );
    return { id, userfieldsResponse, quConversionIds };
  }

  /**
   * Patches a product.
   * @param id Grocy product ID
   * @param patch Values to update for the product
   * @returns The patch API responses
   */
  async patchProduct(id: string, patch: Partial<Product>): Promise<ProductUpdateResponses> {
    const responses: ProductUpdateResponses = {};
    const { userfields: userfieldsPatch, ...productPatch } = patch;
    if (userfieldsPatch) {
      const existingUserfields = await this.rest.getProductUserfields(id);
      const updatedUserfields = { ...existingUserfields, ...userfieldsPatch };
      responses.userfields = await this.rest.putProductUserfields(id, updatedUserfields);
    }
    // Spread operator returns an empty object if no other fields are present
    if (Object.keys(productPatch).length > 0) {
      const existingProduct = await this.rest.getProduct(id);
      const update = { ...existingProduct, ...productPatch };
      responses.coreProduct = await this.rest.putProduct(id, update);
    }
    return responses;
  }

  /**
   * Updates a product.
   * @param id Grocy product ID
   * @param product New product
   * @returns The API responses for update operations
   */
  async updateProduct(id: string, product: Product): Promise<ProductUpdateResponses> {
    const responses: { userfields?: Response; productPatch?: Response } = {};
    const { userfields, ...coreProduct } = product;
    if (userfields) {
      responses.userfields = await this.rest.putProductUserfields(id, userfields);
    }
    responses.productPatch = await this.rest.putProduct(id, coreProduct);
    return responses;
  }
}

interface ProductUpdateResponses {
  userfields?: Response;
  coreProduct?: Response;
}

export interface CreatedProductResponse {
  id: string;
  userfieldsResponse?: Response;
  quConversionIds: string[];
}
