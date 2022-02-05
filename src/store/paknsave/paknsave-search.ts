import fetch from "node-fetch";
import { extractJson } from "@grocy-trolley/utils/fetch-utils";
import { PAKNSAVE_URL } from "./paknsave.model";

export class PakNSaveSearchService {
  readonly url = `${PAKNSAVE_URL}/SearchAutoComplete/AutoComplete`;
  readonly headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  async search(query: string): Promise<ProductSearchResponse> {
    const response = await fetch(this.url, {
      headers: this.headers,
      method: "POST",
      body: JSON.stringify({ SearchTerm: query }),
    });
    return extractJson(response);
  }
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
