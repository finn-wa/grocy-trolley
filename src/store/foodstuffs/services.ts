import { AppInjector } from "@gt/gt";
import { FoodstuffsTokens } from "@gt/injection-tokens";
import { getEnvAs } from "@gt/utils/environment";
import { getBrowser } from "../shared/rest/browser";
import { FoodstuffsCartController } from "./cart/foodstuffs-cart-controller";
import { FoodstuffsCartService } from "./cart/foodstuffs-cart-service";
import { FoodstuffsListService } from "./lists/foodstuffs-list-service";
import { FoodstuffsOrderService } from "./orders/foodstuffs-order-service";
import { FoodstuffsUserAgent } from "./rest/foodstuffs-user-agent";
import { FoodstuffsSearchService } from "./search/foodstuffs-search-service";

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

export function injectFoodstuffsServices(injector: AppInjector) {
  const loginDetails = getEnvAs({ PAKNSAVE_EMAIL: "email", PAKNSAVE_PASSWORD: "password" });

  return injector
    .provideValue(FoodstuffsTokens.loginDetails, loginDetails)
    .provideClass(FoodstuffsTokens.userAgent, FoodstuffsUserAgent)
    .provideClass(FoodstuffsTokens.cartController, FoodstuffsCartController)
    .provideClass(FoodstuffsTokens.cartService, FoodstuffsCartService)
    .provideClass(FoodstuffsTokens.listService, FoodstuffsListService)
    .provideClass(FoodstuffsTokens.orderService, FoodstuffsOrderService)
    .provideClass(FoodstuffsTokens.searchService, FoodstuffsSearchService);
}
