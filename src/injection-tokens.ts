/**
 * All dependency tokens used in the app are defined here.
 * See {@link https://github.com/nicojs/typed-inject}.
 */

/** Global injection tokens */
export const AppTokens = {
  browser: "browser",
} as const;

/** Injection tokens for the Grocy module */
export const GrocyTokens = {
  idLookupServices: {
    locations: "GrocyLocationIdLookupService",
    quantityUnits: "GrocyQuantityUnitIdLookupService",
    productGroups: "GrocyProductGroupIdLookupService",
    shoppingLocations: "GrocyShoppingLocationIdLookupService",
  },
  shoppingListService: "GrocyShoppingListService",
  stockService: "GrocyStockService",
  userEntityService: "GrocyUserEntityService",
  orderRecordService: "GrocyOrderRecordService",
  productService: "GrocyProductService",
  parentProductService: "GrocyParentProductService",
} as const;

/** Injection tokens for the Foodstuffs module */
export const FoodstuffsTokens = {
  loginDetails: "FoodstuffsLoginDetails",
  userAgent: "FoodstuffsUserAgent",
  cartController: "FoodstuffsCartController",
  cartService: "FoodstuffsCartService",
  listService: "FoodstuffsListService",
  orderService: "FoodstuffsOrderService",
  searchService: "FoodstuffsSearchService",
  cartImporter: "FoodstuffsCartImporter",
  listImporter: "FoodstuffsListImporter",
  orderImporter: "FoodstuffsOrderImporter",
  barcodeImporter: "FoodstuffsBarcodeImporter",
  receiptImporter: "FoodstuffsReceiptImporter",
} as const;
