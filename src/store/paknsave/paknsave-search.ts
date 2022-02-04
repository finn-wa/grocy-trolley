/*
const search = await fetch(
  "https://www.paknsave.co.nz/CommonApi/SearchAutoComplete/AutoComplete",
  {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: '{"SearchTerm":"Chocolate"}',
    method: "POST",
  }
);
*/
interface ProductResult {
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
interface ProductCategoryResults {}
interface ProductSearchResponse {
  productCategoryResults: ProductResult[];
  productResults: ProductResult[];
  UserDataSearchMessage: string;
  Success: boolean;
}
