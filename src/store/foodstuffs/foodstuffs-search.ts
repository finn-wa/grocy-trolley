import { ReceiptItemiser, ReceiptScanner } from "@grocy-trolley/receipt-ocr";
import { buildUrl, postForJson } from "@grocy-trolley/utils/rest";
import { headers } from "@grocy-trolley/utils/headers-builder";
import { FoodstuffsReceiptItemiser, PAKNSAVE_URL, SaleTypeString } from ".";
import { FoodstuffsRestService } from "./foodstuffs-rest-service";

export class FoodstuffsSearchService {
  private readonly itemiser = new FoodstuffsReceiptItemiser();

  constructor(readonly baseUrl: string) {}

  async importInStoreOrder(receiptScanner: ReceiptScanner, filepath: string) {
    const text = await receiptScanner.scan(filepath);
    const scannedItems = await this.itemiser.itemise(text);
    console.log(scannedItems);
    for await (const search of scannedItems.map(async (item) => {
      console.log(item.name);
      return [item.name, await searchPakNSave(item.name)] as const;
    })) {
      const [item, searchRes] = search;
      console.log(item);
      const numResults = searchRes.productResults.length;
      if (!searchRes.Success || numResults === 0) {
        console.log("Search failed\n");
        continue;
      }
      const products = searchRes.productResults.slice(0, Math.min(3, numResults));
      products.forEach((product) => {
        console.log(
          `${product.ProductName} (${product.ProductWeightDisplayName}) - ${product.ProductBrand}`
        );
        console.log(product.ProductUrl, "\n");
      });
    }
  }
}

export async function searchFoodstuffs(
  baseUrl: string,
  query: string
): Promise<ProductSearchResponse> {
  return postForJson(
    buildUrl(baseUrl, "SearchAutoComplete/AutoComplete"),
    headers().acceptJson().contentTypeJson().build(),
    { SearchTerm: query }
  );
}

export async function searchPakNSave(query: string): Promise<ProductSearchResponse> {
  return searchFoodstuffs(PAKNSAVE_URL, query);
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
export interface ProductCategoryResults {}

export interface ProductSearchResponse {
  productCategoryResults: ProductResult[];
  productResults: ProductResult[];
  UserDataSearchMessage: string;
  Success: boolean;
}
