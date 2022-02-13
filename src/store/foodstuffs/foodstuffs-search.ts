import { buildUrl, postForJson } from "@grocy-trolley/utils/fetch-utils";
import { headers } from "@grocy-trolley/utils/headers-builder";
import { PAKNSAVE_URL, SaleTypeString } from ".";

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

export async function searchPakNSave(
  query: string
): Promise<ProductSearchResponse> {
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
