import { buildUrl, postForJson } from "@grocy-trolley/utils/fetch-utils";
import { headers } from "@grocy-trolley/utils/headers-builder";
import { PAKNSAVE_URL } from ".";

export async function searchPakNSave(
  query: string
): Promise<ProductSearchResponse> {
  return postForJson(
    buildUrl(PAKNSAVE_URL, "SearchAutoComplete/AutoComplete"),
    headers().acceptJson().contentTypeJson().build(),
    { SearchTerm: query }
  );
}

export interface ProductResult {
  ProductName: string;
  ProductThumbnailUrl: string;
  ProductUrl: string;
  ProductWeightDisplayName: string;
  ProductBrand: string;
  ProductId: string;
  SaleType: string;
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
