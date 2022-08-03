import { ConversionWithoutId } from "@gt/store/foodstuffs/grocy/import/product-converter";
import { Logger } from "@gt/utils/logger";
import { singleton } from "tsyringe";
import { GrocyProductController } from "./grocy-product-controller";
import { NewProduct, Product } from "./types/Product";
import { parseProductBarcode, ProductBarcode, RawProductBarcode } from "./types/ProductBarcodes";
import { getProductBarcodesSchema } from "./types/ProductBarcodes/schema";

export const products = "products";

@singleton()
export class GrocyProductService {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(private readonly rest: GrocyProductController) {}

  /**
   * Gets all products.
   * @returns An array of products
   */
  getAllProducts(): Promise<Product[]> {
    return this.rest.getProducts();
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
   * Deletes a product.
   * @param id ID of product to delete
   * @returns the API response
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
      return { id, userfieldsResponse };
    }
    await Promise.all(
      quConversions.map((conversion) =>
        this.rest.createQuantityUnitConversion({ ...conversion, product_id: id })
      )
    );
    return { id, userfieldsResponse };
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

  /**
   * Gets barcodes for all products, or for a specific product.
   * @param productId grocy product ID (optional)
   * @returns an array of product barcodes
   */
  async getProductBarcodes(productId?: string): Promise<ProductBarcode[]> {
    const filter = productId ? `query[]=product_id=${productId}` : "";
    const rawBarcodes = await this.rest.getEntityObjects(
      "product_barcodes",
      getProductBarcodesSchema(),
      filter
    );
    return rawBarcodes.map(parseProductBarcode);
  }

  /**
   * Adds a barcode to a product.
   * @param productId Grocy product ID
   * @param barcode the barcode number
   * @returns the created object ID for the barcode
   */
  async addProductBarcode(productId: string, barcode: string) {
    const body: Omit<RawProductBarcode, "id" | "row_created_timestamp" | "last_price"> = {
      amount: "",
      barcode,
      note: "",
      product_id: productId,
      qu_id: "",
      shopping_location_id: "",
    };
    return this.rest.postEntityObject("product_barcodes", body);
  }
}

interface ProductUpdateResponses {
  userfields?: Response;
  coreProduct?: Response;
}

export interface CreatedProductResponse {
  id: string;
  userfieldsResponse?: Response;
}
