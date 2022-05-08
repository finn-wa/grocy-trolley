import { SaleTypeString } from "../models";

export type SearchAgentType = "USER" | "ANON" | "BOTH";

export interface ProductSearchResult {
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
export type CategorySearchResult = unknown;

export interface ProductSearchResponse {
  productCategoryResults: CategorySearchResult[];
  productResults: ProductSearchResult[];
  UserDataSearchMessage: string;
  Success: boolean;
}
