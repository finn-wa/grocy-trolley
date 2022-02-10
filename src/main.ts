import { EnvParser } from "@grocy-trolley/env";
import { TaggunReceiptScanner } from "@grocy-trolley/receipt-ocr";
import {
  PakNSaveAuthService,
  PakNSaveReceiptItemiser,
  searchPakNSave,
} from "@grocy-trolley/store/paknsave";
import { exit } from "process";
import { PakNSaveOrderService } from "./store/paknsave/paknsave-orders";
import { prettyPrint } from "./utils/logging-utils";

class Main {
  constructor(
    private readonly pnsOrderService: PakNSaveOrderService,
    private readonly pnsReceiptItemiser: PakNSaveReceiptItemiser,
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
      const products = searchRes.productResults.slice(
        0,
        Math.min(3, numResults)
      );
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
  const pnsAuthService = new PakNSaveAuthService(
    env.PAKNSAVE_EMAIL,
    env.PAKNSAVE_PASSWORD
  );
  await pnsAuthService.login();

  const main = new Main(
    new PakNSaveOrderService(pnsAuthService),
    new PakNSaveReceiptItemiser(),
    new TaggunReceiptScanner(env.TAGGUN_API_KEY)
  );

  const res = await main.importOnlineOrders();
  console.log(prettyPrint(res));
  return;
}

main().then(
  () => exit(0),
  (err) => {
    console.error(err);
    exit(1);
  }
);
