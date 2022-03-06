import { headers } from "@grocy-trolley/utils/headers-builder";
import { Logger } from "@grocy-trolley/utils/logger";
import { setTimeout } from "timers/promises";
import { SaleTypeString } from ".";
import { FoodstuffsRestService } from "./foodstuffs-rest-service";

export class FoodstuffsSearchService extends FoodstuffsRestService {
  protected readonly logger = new Logger(this.constructor.name);

  private readonly timeout = 1000;
  private readonly searchCookieKeys = ["STORE_ID_V2", "Region", "AllowRestrictedItems"];
  private lastSearchTime = 0;
  private _searchCookie: string | null = null;

  async search(query: string): Promise<ProductSearchResponse> {
    await this.cooldown();
    const searchCookie = await this.getSearchCookie();
    return this.postForJson(
      this.buildUrl("SearchAutoComplete/AutoComplete"),
      headers().acceptJson().contentTypeJson().cookie(searchCookie).build(),
      { SearchTerm: query }
    );
  }

  async searchProducts(query: string): Promise<ProductResult[]> {
    const response = await this.search(query);
    return response.productResults;
  }

  private async getSearchCookie(): Promise<string> {
    if (!this._searchCookie) {
      const cookieHeaders = await this.authService.getCookieHeaders();
      const searchCookieHeaders = cookieHeaders.filter((cookie) =>
        this.searchCookieKeys.some((key) => cookie.startsWith(key))
      );
      this._searchCookie = this.authService.toCookieRequestHeader(searchCookieHeaders);
    }
    return this._searchCookie;
  }

  private async cooldown(): Promise<void> {
    const elapsed = Date.now() - this.lastSearchTime;
    if (elapsed < this.timeout) {
      await setTimeout(this.timeout - elapsed);
    }
    this.lastSearchTime = Date.now();
  }
}

export interface ProductResult {
  ProductName: string;
  ProductThumbnailUrl: string;
  ProductUrl: string;
  ProductWeightDisplayName: string;
  ProductBrand: string;
  ProductId: string;
  SaleType: SaleTypeString;
  ProductVariants: string;
  Restricted: boolean;
  Tobacco: boolean;
  RangedOnline: boolean;
  RangedInStore: boolean;
}

/** TODO: get model */
// export interface ProductCategoryResults {}

export interface ProductSearchResponse {
  productCategoryResults: ProductResult[];
  productResults: ProductResult[];
  UserDataSearchMessage: string;
  Success: boolean;
}
