import { firefox } from "playwright";
import { LogLevel, playwrightLogger } from "utils/logger";
import { FoodstuffsCartService } from "./foodstuffs-cart";
import { FoodstuffsListService } from "./foodstuffs-lists";
import { FoodstuffsOrderService } from "./foodstuffs-orders";
import { FoodstuffsSearchService } from "./foodstuffs-search";
import { FoodstuffsUserAgent } from "./foodstuffs-user-agent";

export * from "./foodstuffs-cart";
export * from "./foodstuffs-categories";
export * from "./foodstuffs-lists";
export * from "./foodstuffs-orders";
export * from "./foodstuffs-search";
export * from "./foodstuffs-user-agent";
export * from "./foodstuffs.model";
export * from "./purchase/shopping-list-exporter";

export async function foodstuffsServices(): Promise<FoodstuffsServices> {
  const browser = await firefox.launch({
    headless: true,
    logger: playwrightLogger(LogLevel.WARN),
  });
  const userAgent = new FoodstuffsUserAgent(browser);
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
