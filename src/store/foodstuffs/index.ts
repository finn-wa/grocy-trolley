import { getEnvAs } from "@gt/utils/environment";
import { firefox } from "playwright";
import { LogLevel, playwrightLogger } from "@gt/utils/logger";
import { FoodstuffsCartService } from "./cart/foodstuffs-cart";
import { FoodstuffsListService } from "./foodstuffs-lists";
import { FoodstuffsOrderService } from "./foodstuffs-orders";
import { FoodstuffsSearchService } from "./foodstuffs-search";
import { FoodstuffsUserAgent } from "./user-agent/foodstuffs-user-agent";

export * from "./cart/foodstuffs-cart";
export * from "./foodstuffs-categories";
export * from "./foodstuffs-lists";
export * from "./foodstuffs-orders";
export * from "./foodstuffs-search";
export * from "./user-agent/foodstuffs-user-agent";
export * from "./foodstuffs.model";
export * from "./purchase/shopping-list-exporter";

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
