import { headersBuilder } from "@gt/utils/headers";
import { Logger } from "@gt/utils/logger";
import { RestService } from "@gt/utils/rest";
import { singleton } from "tsyringe";
import { Store } from "../stores/types/Stores";
import { getStoresSchema } from "../stores/types/Stores/schema";
import { ProductPrice } from "./types/ProductPrices";
import { getProductPricesSchema } from "./types/ProductPrices/schema";

@singleton()
export class GrocerApiService extends RestService {
  protected readonly baseUrl = "https://api.grocer.nz";
  protected readonly logger = new Logger(this.constructor.name);

  async getStores(): Promise<Store[]> {
    return this.getAndParse(this.buildUrl("/stores"), {}, getStoresSchema());
  }

  async getProductPrices(params: {
    productIds: number[];
    storeIds: number[];
  }): Promise<ProductPrice[]> {
    const url = new URL(`${this.baseUrl}/products`);
    const paramsBuilder = new URLSearchParams();
    Object.entries(params).forEach(([key, values]) => {
      const paramKey = `${key}[]`;
      values.forEach((value) => paramsBuilder.append(paramKey, value.toString()));
    });
    url.search = paramsBuilder.toString();
    return this.getAndParse(
      url.toString(),
      { headers: headersBuilder().acceptJson().build() },
      getProductPricesSchema()
    );
  }
}
