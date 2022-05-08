import { getEnvAs } from "@gt/utils/environment";
import { firefox } from "playwright";
import { LogLevel, playwrightLogger } from "@gt/utils/logger";
import { FoodstuffsCartService } from "./cart/foodstuffs-cart-service";
import { FoodstuffsListService } from "./lists/foodstuffs-list-service";
import { FoodstuffsOrderService } from "./orders/foodstuffs-order-service";
import { FoodstuffsSearchService } from "./search/foodstuffs-search-service";
import { FoodstuffsUserAgent } from "./rest/foodstuffs-user-agent";

export async function foodstuffsServices(): Promise<FoodstuffsServices> {
  const browser = await firefox.launch({
    headless: true,
    logger: playwrightLogger(LogLevel.WARN),
  });
  const userAgent = new FoodstuffsUserAgent(
    browser,
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
