import { FoodstuffsAuthService } from "./foodstuffs-auth";
import { FoodstuffsCartService } from "./foodstuffs-cart";
import { FoodstuffsListService } from "./foodstuffs-lists";
import { FoodstuffsOrderService } from "./foodstuffs-orders";
import { FoodstuffsSearchService } from "./foodstuffs-search";

export * from "./foodstuffs-auth";
export * from "./foodstuffs-cart";
export * from "./foodstuffs-categories";
export * from "./foodstuffs-lists";
export * from "./foodstuffs-orders";
export * from "./foodstuffs-receipt-itemiser";
export * from "./foodstuffs-search";
export * from "./foodstuffs.model";
export * from "./grocy/foodstuffs-converter";
export * from "./grocy/foodstuffs-importers";

export function foodstuffsServices(): FoodstuffsServices {
  const authService = new FoodstuffsAuthService();
  return {
    authService,
    cartService: new FoodstuffsCartService(authService),
    listService: new FoodstuffsListService(authService),
    orderService: new FoodstuffsOrderService(authService),
    searchService: new FoodstuffsSearchService(authService),
  };
}

export interface FoodstuffsServices {
  authService: FoodstuffsAuthService;
  cartService: FoodstuffsCartService;
  listService: FoodstuffsListService;
  orderService: FoodstuffsOrderService;
  searchService: FoodstuffsSearchService;
}
