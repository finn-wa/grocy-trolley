import { getEnvAs } from "@gt/utils/environment";
import { FoodstuffsCartService } from "./cart/foodstuffs-cart-service";
import { getBrowser } from "../shared/rest/browser";
import { FoodstuffsListService } from "./lists/foodstuffs-list-service";
import { FoodstuffsOrderService } from "./orders/foodstuffs-order-service";
import { FoodstuffsUserAgent } from "./rest/foodstuffs-user-agent";
import { FoodstuffsSearchService } from "./search/foodstuffs-search-service";

export async function foodstuffsServices(): Promise<FoodstuffsServices> {
  const userAgent = new FoodstuffsUserAgent(
    getBrowser,
    getEnvAs({ PAKNSAVE_EMAIL: "email", PAKNSAVE_PASSWORD: "password" })
  );
  return {
    userAgent,
    cartService: new FoodstuffsCartService(userAgent),
    listService: new FoodstuffsListService(userAgent),
    orderService: new FoodstuffsOrderService(userAgent),
    searchService: new FoodstuffsSearchService(userAgent),
  };
}

export interface FoodstuffsServices {
  userAgent: FoodstuffsUserAgent;
  cartService: FoodstuffsCartService;
  listService: FoodstuffsListService;
  orderService: FoodstuffsOrderService;
  searchService: FoodstuffsSearchService;
}
