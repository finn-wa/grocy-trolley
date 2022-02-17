import { EnvParser } from "@grocy-trolley/env";
import {
  FoodstuffsAuthService,
  FoodstuffsCartService,
  FoodstuffsListService,
  FoodstuffsOrderService,
  FoodstuffsToGrocyService,
  PAKNSAVE_URL,
} from "@grocy-trolley/store/foodstuffs";
import { exit } from "process";
import {
  GrocyIdMapService,
  GrocyOrderRecordService,
  GrocyProductService,
  GrocyUserEntityService,
} from "./grocy";

async function main() {
  const env = new EnvParser("env.json").env;
  const grocyIdMapService = new GrocyIdMapService(env.GROCY_API_KEY, env.GROCY_URL);
  const grocyIdMaps = await grocyIdMapService.getAllIdMaps();

  const authService = new FoodstuffsAuthService(
    PAKNSAVE_URL,
    env.PAKNSAVE_EMAIL,
    env.PAKNSAVE_PASSWORD
  );

  const productService = new GrocyProductService(env.GROCY_API_KEY, env.GROCY_URL);
  const importer = new FoodstuffsToGrocyService(
    new FoodstuffsCartService(authService),
    new FoodstuffsListService(authService),
    new FoodstuffsOrderService(authService),
    productService,
    new GrocyOrderRecordService(
      env.GROCY_API_KEY,
      env.GROCY_URL,
      new GrocyUserEntityService(env.GROCY_API_KEY, env.GROCY_URL)
    ),
    grocyIdMaps
  );

  await authService.login();
  await importer.importProductsFromOrders();
}

main().then(
  () => exit(0),
  (err) => {
    console.error(err);
    exit(1);
  }
);
