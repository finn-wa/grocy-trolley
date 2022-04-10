import { uniqueByProperty } from "utils/arrays";
import prompts from "prompts";
import { setTimeout } from "timers/promises";
import { headers } from "utils/headers-builder";
import { Logger } from "utils/logger";
import { CartProductRef, SaleTypeString } from ".";
import { ListProductRef } from "./foodstuffs-lists";
import { FoodstuffsRestService } from "./foodstuffs-rest-service";

export class FoodstuffsSearchService extends FoodstuffsRestService {
  protected readonly logger = new Logger(this.constructor.name);

  private readonly timeout = 1000;
  private readonly searchCookieKeys = ["STORE_ID_V2", "Region", "AllowRestrictedItems"];
  private lastSearchTime = 0;
  private _searchCookie: string | null = null;

  /**
   * Searches Foodstuffs.
   * @param query Search query
   * @param options Search options
   * @returns Search response
   */
  async search(
    query: string
    // options: SearchOptions = { includeCookies: false }
  ): Promise<ProductSearchResponse> {
    this.logger.info("Searching Foodstuffs: " + query);
    await this.cooldown();
    const headersBuilder = headers().acceptJson().contentTypeJson();
    // if (options.includeCookies) {
    // const searchCookie = await this.getSearchCookie();
    // headersBuilder.cookie(searchCookie);
    // }
    return this.postForJson(
      this.buildUrl("SearchAutoComplete/AutoComplete"),
      headersBuilder.build(),
      { SearchTerm: query }
    );
  }

  /**
   * Searches Foodstuffs products.
   * @param query Search query
   * @param options Search options
   * @returns Search response
   */
  async searchProducts(
    query: string,
    options: SearchOptions = { includeCookies: false }
  ): Promise<ProductResult[]> {
    // TODO: reinstate options
    const response = await this.search(query);
    return response.productResults;
  }

  async searchAndSelectProduct(barcode: string): Promise<ProductResult | null> {
    const results = await Promise.all([
      this.searchProducts(barcode, { includeCookies: false }),
      // this.searchProducts(barcode, { includeCookies: true }),
    ]).then((results) => uniqueByProperty(results.flat(), "ProductId"));
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
          { title: "Skip", value: null as any },
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

  resultToListRef(product: ProductResult): ListProductRef {
    return {
      productId: product.ProductId,
      saleType: product.SaleType,
      quantity: 1,
    };
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

export interface SearchOptions {
  /**
   * Restricts results to those in stock for the selected store, but reduces
   * chance of "Product not ranged for online" error when adding to cart.
   */
  includeCookies: boolean;
}
