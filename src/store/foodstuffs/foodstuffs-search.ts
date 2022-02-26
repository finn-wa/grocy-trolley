import { ReceiptScanner } from "@grocy-trolley/receipt-ocr";
import { headers } from "@grocy-trolley/utils/headers-builder";
import { Logger } from "@grocy-trolley/utils/logger";
import { RestService } from "@grocy-trolley/utils/rest";
import { FoodstuffsReceiptItemiser, SaleTypeString } from ".";

export class FoodstuffsSearchService extends RestService {
  protected readonly logger = new Logger(this.constructor.name);
  private readonly itemiser = new FoodstuffsReceiptItemiser();

  constructor(readonly baseUrl: string) {
    super();
  }

  async importInStoreOrder(receiptScanner: ReceiptScanner, filepath: string) {
    const text = await receiptScanner.scan(filepath);
    const scannedItems = await this.itemiser.itemise(text);
    this.logger.info(scannedItems.join("\n"));
    for await (const search of scannedItems.map(async (item) => {
      this.logger.debug(item.name);
      return [item.name, await this.search(item.name)] as const;
    })) {
      const [item, searchRes] = search;
      this.logger.debug(item);
      const numResults = searchRes.productResults.length;
      if (!searchRes.Success || numResults === 0) {
        this.logger.error("Search failed\n");
        continue;
      }
      const products = searchRes.productResults.slice(0, Math.min(3, numResults));
      products.forEach((product) => {
        this.logger.info(
          `${product.ProductName} (${product.ProductWeightDisplayName}) - ${product.ProductBrand}`
        );
        this.logger.info(product.ProductUrl, "\n");
      });
    }
  }

  async search(query: string): Promise<ProductSearchResponse> {
    return this.postForJson(
      this.buildUrl("SearchAutoComplete/AutoComplete"),
      headers().acceptJson().contentTypeJson().build(),
      { SearchTerm: query }
    );
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
