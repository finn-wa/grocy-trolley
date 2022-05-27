import { getEnvAs } from "@gt/utils/environment";
import { FoodstuffsCartService } from "./cart/foodstuffs-cart-service";
import { getBrowser } from "../shared/rest/browser";
import { FoodstuffsListService } from "./lists/foodstuffs-list-service";
import { FoodstuffsOrderService } from "./orders/foodstuffs-order-service";
import { FoodstuffsUserAgent } from "./rest/foodstuffs-user-agent";
import { FoodstuffsSearchService } from "./search/foodstuffs-search-service";
import { FoodstuffsCartController } from "./cart/foodstuffs-cart-controller";

export async function foodstuffsServices(): Promise<FoodstuffsServices> {
  const loginDetails = getEnvAs({ PAKNSAVE_EMAIL: "email", PAKNSAVE_PASSWORD: "password" });
  const userAgent = new FoodstuffsUserAgent(getBrowser, loginDetails);
  return {
    userAgent,
    cartService: new FoodstuffsCartService(new FoodstuffsCartController(userAgent)),
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
