import { EnvParser } from "@grocy-trolley/env";
import { TaggunReceiptScanner } from "@grocy-trolley/receipt-ocr";
import {
  FoodstuffsAuthService,
  FoodstuffsReceiptItemiser,
  PAKNSAVE_URL,
  searchPakNSave,
  FoodstuffsOrderService,
  FoodstuffsCartService,
  FoodstuffsListService,
  FoodstuffsToGrocyService,
} from "@grocy-trolley/store/foodstuffs";
import { exit } from "process";
import {
  GrocyIdMapService,
  GrocyOrderRecordService,
  GrocyProductService,
  GrocyUserEntityService,
} from "./grocy";
import { prettyPrint } from "./utils/logging-utils";

class Main {
  constructor(
    private readonly pnsOrderService: FoodstuffsOrderService,
    private readonly pnsReceiptItemiser: FoodstuffsReceiptItemiser,
    private readonly taggunReceiptScanner: TaggunReceiptScanner
  ) {}

  async importInStoreOrder(filepath: string) {
    const text = await this.taggunReceiptScanner.scan(filepath);
    const scannedItems = await this.pnsReceiptItemiser.itemise(text);
    console.log(scannedItems);
    for await (const search of scannedItems.map(async (item) => {
      console.log(item.name);
      return [item.name, await searchPakNSave(item.name)] as const;
    })) {
      const [item, searchRes] = search;
      console.log(item);
      const numResults = searchRes.productResults.length;
      if (!searchRes.Success || numResults === 0) {
        console.log("Search failed\n");
        continue;
      }
      const products = searchRes.productResults.slice(0, Math.min(3, numResults));
      products.forEach((product) => {
        console.log(
          `${product.ProductName} (${product.ProductWeightDisplayName}) - ${product.ProductBrand}`
        );
        console.log(product.ProductUrl, "\n");
      });
    }
  }

  async importOnlineOrders() {
    return this.pnsOrderService.getOrderDetails("55449569");
  }
}

async function main() {
  const env = new EnvParser("env.json").env;
  const grocyIdMapService = new GrocyIdMapService(env.GROCY_API_KEY, env.GROCY_URL);
  const grocyIdMaps = await grocyIdMapService.getAllIdMaps();

  const authService = new FoodstuffsAuthService(
    PAKNSAVE_URL,
    env.PAKNSAVE_EMAIL,
    env.PAKNSAVE_PASSWORD
  );
  await authService.login();

  const importer = new FoodstuffsToGrocyService(
    new FoodstuffsCartService(authService),
    new FoodstuffsListService(authService),
    new FoodstuffsOrderService(authService),
    new GrocyProductService(env.GROCY_API_KEY, env.GROCY_URL),
    new GrocyOrderRecordService(
      env.GROCY_API_KEY,
      env.GROCY_URL,
      new GrocyUserEntityService(env.GROCY_API_KEY, env.GROCY_URL)
    ),
    grocyIdMaps
  );
  await importer.importProductsFromCart();
}

main().then(
  () => exit(0),
  (err) => {
    console.error(err);
    exit(1);
  }
);
