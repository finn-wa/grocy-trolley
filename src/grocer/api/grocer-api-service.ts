import { headersBuilder } from "@gt/utils/headers";
import { Logger } from "@gt/utils/logger";
import { RestService } from "@gt/utils/rest";
import { Lifecycle, scoped } from "tsyringe";
import { Store } from "../stores/types/Stores";
import { getStoresSchema } from "../stores/types/Stores/schema";
import { GrocerBarcodeProduct } from "./types/GrocerBarcodeProduct";
import { getGrocerBarcodeProductSchema } from "./types/GrocerBarcodeProduct/schema";
import { GrocerProduct } from "./types/GrocerProduct";
import { getGrocerProductsSchema } from "./types/GrocerProduct/schema";

@scoped(Lifecycle.ContainerScoped)
export class GrocerApiService extends RestService {
  protected readonly baseUrl = "https://api.grocer.nz";
  protected readonly logger = new Logger(this.constructor.name);

  async getStores(): Promise<Store[]> {
    return this.getAndParse(this.buildUrl("/stores"), {}, getStoresSchema());
  }

  async getProductForBarcode(params: {
    barcode: string;
    stores: number[];
  }): Promise<GrocerBarcodeProduct> {
    return this.getAndParse(
      this.buildGrocerUrl("/product", params),
      { headers: headersBuilder().acceptJson().build() },
      getGrocerBarcodeProductSchema()
    );
  }

  async getProductPrices(params: {
    productIds: number[];
    storeIds: number[];
  }): Promise<GrocerProduct[]> {
    return this.getAndParse(
      this.buildGrocerUrl("/products", params),
      { headers: headersBuilder().acceptJson().build() },
      getGrocerProductsSchema()
    );
  }

  /**
   * Generates a grocer-compatible url for the given path and params.
   * Grocer has an ungodly way of encoding query params, and URLSearchParams can't
   * be used because it tries to URL-encode the square brackets.
   * @param path relative to baseUrl
   * @param params query parameters
   * @returns a URL compatible with grocer API
   */
  protected buildGrocerUrl(
    path: string,
    params?: Record<string, string | number | (string | number)[]>
  ): string {
    const url = this.buildUrl(path);
    if (!params || Object.keys(params).length === 0) {
      return url;
    }
    const queryParams = Object.entries(params).flatMap(([key, value]) => {
      return Array.isArray(value)
        ? value.map((element) => `${key}[]=${element}`)
        : [`${key}=${value}`];
    });
    return url + "?" + queryParams.join("&");
  }
}
