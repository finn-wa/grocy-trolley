import { ReceiptScanner } from "@grocy-trolley/receipt-ocr";
import { ReceiptItem, ReceiptItemiser } from "@grocy-trolley/receipt-ocr/receipts.model";
import { Logger, prettyPrint } from "@grocy-trolley/utils/logger";
import { readFile, writeFile } from "fs/promises";
import prompts from "prompts";
import { FoodstuffsCartImporter } from ".";
import { CartProductRef, FoodstuffsSearchService } from "..";

export class FoodstuffsReceiptImporter implements ReceiptItemiser {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private readonly cartImporter: FoodstuffsCartImporter,
    private readonly searchService: FoodstuffsSearchService,
    private readonly scanner: ReceiptScanner
  ) {}

  async importReceipt(filepath: string): Promise<void> {
    const scannedItemsPath = filepath.replace(/\.[\w]+$/, ".json");
    let scannedItems: ReceiptItem[] = [];
    const cachedScannedItems = await this.getCachedScannedItems(scannedItemsPath);
    if (cachedScannedItems !== null) {
      scannedItems = cachedScannedItems;
    }
    if (scannedItems.length === 0) {
      const text = await this.scanner.scan(filepath);
      scannedItems = await this.itemise(text);
      await writeFile(scannedItemsPath, prettyPrint(scannedItems));
      console.log(`Wrote items to ${scannedItemsPath}`);
    }

    console.log(prettyPrint(scannedItems));
    const confirm = await prompts([
      { name: "import", message: "Import items? Change file as needed", type: "confirm" },
    ]);
    if (confirm.import) {
      const updatedItems = await this.getCachedScannedItems(scannedItemsPath);
      if (updatedItems === null) {
        throw new Error("Error reading file " + scannedItemsPath);
      }
      await this.importScannedItems(updatedItems);
    }
  }

  private async getCachedScannedItems(filepath: string): Promise<ReceiptItem[] | null> {
    let itemsString;
    try {
      itemsString = await readFile(filepath, { encoding: "utf-8" });
    } catch (error) {
      this.logger.debug("No cached scanned items found at " + filepath);
      return null;
    }
    const confirm = await prompts([
      {
        name: "useCache",
        message: `Use cached items found at "${filepath}"?`,
        type: "confirm",
      },
    ]);
    if (confirm.useCache) {
      return JSON.parse(itemsString);
    }
    return null;
  }

  async importScannedItems(scannedItems: ReceiptItem[]) {
    const notFound: ReceiptItem[] = [];
    const cartRefs: CartProductRef[] = [];
    for (const item of scannedItems) {
      const searchRes = await this.searchService.searchAndSelectProduct(item.name);
      if (searchRes === null) {
        notFound.push(item);
      } else {
        cartRefs.push(this.searchService.resultToCartRef(searchRes));
      }
    }
    this.logger.info("Failed to find:\n" + prettyPrint(notFound));
    this.logger.info("Found:\n" + prettyPrint(cartRefs));
    const importProducts = await prompts([
      {
        message: "Import products?",
        name: "value",
        type: "confirm",
      },
    ]);
    if (importProducts.value) {
      return this.cartImporter.importProductRefs(cartRefs);
    }
  }

  /**
   * Itemises a PAK'n'SAVE/New World receipt.
   */
  itemise(text: string): Promise<ReceiptItem[]> {
    const lines = text.trim().split("\n")[Symbol.iterator]();
    const items: ReceiptItem[] = [];
    let line: IteratorResult<string, void>;
    do {
      line = lines.next();
      if (!line.value) break;
      const lineValue = line.value.trim();
      if (lineValue.startsWith("Supervisor")) {
        continue;
      }
      const split = lineValue.split("$");
      if (split.length === 1) {
        const item = lineValue;
        line = lines.next();
        items.push(this.parseQuantity(item, line));
      } else if (split.length === 2) {
        const name = split[0].trim();
        let amount = Number(split[1]);
        // Check if line represents a discount
        if (name.endsWith(" -")) {
          amount *= -1;
        }
        items.push({ name, amount });
      }
    } while (!line.done);
    return Promise.resolve(items);
  }

  private parseQuantity(item: string, quantityLine: IteratorResult<string, void>): ReceiptItem {
    if (quantityLine.done || !quantityLine.value) {
      throw new Error(`Expected a quantity line after ${item}, but reached EOF`);
    }
    const quantityLineValue = quantityLine.value.trim();
    const quantitySplit = quantityLineValue.split("$");
    if (quantitySplit.length === 2) {
      const [amount, price] = quantitySplit;
      return { name: `${item} (${amount.trim()})`, amount: Number(price) };
    }
    if (quantitySplit.length === 3) {
      return {
        name: `${item} (${quantitySplit[0]}$${quantitySplit[1].trim()})`,
        amount: Number(quantitySplit[2]),
      };
    }
    throw new Error(`Expected a quantity line after ${item}, but found ${quantityLineValue}`);
  }
}
