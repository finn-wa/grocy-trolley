import { headers } from "@grocy-trolley/utils/headers-builder";
import { Logger } from "@grocy-trolley/utils/logger";
import prompts from "prompts";
import { setTimeout } from "timers/promises";
import { CartProductRef, SaleTypeString } from ".";
import { FoodstuffsRestService } from "./foodstuffs-rest-service";

export class FoodstuffsSearchService extends FoodstuffsRestService {
  protected readonly logger = new Logger(this.constructor.name);

  private readonly timeout = 1000;
  private readonly searchCookieKeys = ["STORE_ID_V2", "Region", "AllowRestrictedItems"];
  private lastSearchTime = 0;
  private _searchCookie: string | null = null;

  async search(query: string): Promise<ProductSearchResponse> {
    this.logger.info("Searching Foodstuffs: " + query);
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

  async searchAndSelectProduct(barcode: string): Promise<ProductResult | null> {
    let results = await this.searchProducts(barcode);
    if (results.length === 0) {
      return null;
    }
    if (results.length === 1) {
      const product = results[0];
      this.logger.info(`Found product ${product.ProductId}: ${product.ProductName}`);
      return product;
    }
    const choice = await prompts([
      {
        message: "Results",
        name: "value",
        type: "select",
        choices: [
          { title: "Skip", value: null },
          ...results.map((r) => ({
            title: `${r.ProductBrand} ${r.ProductName} ${r.ProductWeightDisplayName}`,
            value: r,
          })),
        ],
      },
    ]);
    return choice.value;
  }

  resultToCartRef(product: ProductResult): CartProductRef {
    return {
      productId: product.ProductId,
      restricted: product.Restricted,
      sale_type: product.SaleType,
      quantity: 1,
    };
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
