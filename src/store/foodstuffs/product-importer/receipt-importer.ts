import { readFile, writeFile } from "fs/promises";
import { GrocyProductService } from "grocy";
import prompts from "prompts";
import { ReceiptScanner } from "receipt-ocr";
import { ReceiptItem, ReceiptItemiser } from "receipt-ocr/receipts.model";
import { Logger, prettyPrint } from "utils/logger";
import { FoodstuffsCartImporter } from ".";
import { CartProductRef, FoodstuffsSearchService } from "..";
import { toCartProductRef } from "../foodstuffs-cart";
import { FoodstuffsCartProduct } from "../foodstuffs.model";

export class FoodstuffsReceiptImporter implements ReceiptItemiser {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private readonly cartImporter: FoodstuffsCartImporter,
    private readonly searchService: FoodstuffsSearchService,
    private readonly scanner: ReceiptScanner,
    private readonly grocyProductService: GrocyProductService
  ) {}

  async importReceipt(filepath: string): Promise<void> {
    const scannedItemsPath = filepath.replace(/\.[\w]+$/, ".json");
    let scannedItems: ReceiptItem[] = [];
    const cachedScannedItems = await this.getCachedScannedItems(scannedItemsPath);
    if (cachedScannedItems !== null) {
      const confirm = await prompts([
        {
          name: "useCache",
          message: `Use cached items found at "${filepath}"?`,
          type: "confirm",
        },
      ]);
      if (confirm.useCache) {
        scannedItems = cachedScannedItems;
      }
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
    return JSON.parse(itemsString) as ReceiptItem[];
  }

  async importScannedItems(scannedItems: ReceiptItem[]) {
    const notFound: ReceiptItem[] = [];
    const cartRefs: Record<string, CartProductRef> = {};
    const existingProducts = await this.grocyProductService
      .getProductsWithParsedUserfields()
      .then((products) => products.filter((p) => p.userfields.storeMetadata?.receiptNames?.length));

    for (const item of scannedItems) {
      const existingMatch = existingProducts.find((p) =>
        (p.userfields.storeMetadata?.receiptNames as string[]).includes(item.name)
      );
      if (existingMatch) {
        this.logger.info(`Matched receipt item ${item.name} to Grocy product!`);
        cartRefs[item.name] = toCartProductRef(
          existingMatch.userfields.storeMetadata?.PNS as FoodstuffsCartProduct
        );
        continue;
      }
      const searchRes = await this.searchService.searchAndSelectProduct(item.name);
      if (searchRes === null) {
        notFound.push(item);
      } else {
        cartRefs[item.name] = this.searchService.resultToCartRef(searchRes);
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
      return this.importReceiptCartRefs(cartRefs);
    }
  }

  /**
   * Imports resolved receipt items.
   * @param cartRefs map of receipt item name to cart ref
   */
  async importReceiptCartRefs(cartRefs: Record<string, CartProductRef>) {
    await this.cartImporter.importProductRefs(Object.values(cartRefs));
    const productsByPnsId = await this.grocyProductService.getProductsByFoodstuffsId();
    for (const [name, ref] of Object.entries(cartRefs)) {
      const product = productsByPnsId[ref.productId.replaceAll("_", "-").replace(/(PNS|NW)$/, "")];
      if (!product) {
        this.logger.error(`No product found for ${ref.productId} / ${name}`);
        continue;
      }
      const userfields = await this.grocyProductService.getProductUserfields(product.id);
      const storeMetadata = userfields.storeMetadata ?? {};
      const receiptNames = new Set(userfields?.storeMetadata?.receiptNames ?? []);
      receiptNames.add(name);
      const updatedUserfields = {
        ...userfields,
        storeMetadata: {
          ...storeMetadata,
          receiptNames: Array.from(receiptNames),
        },
      };
      await this.grocyProductService.updateProductUserfields(product.id, updatedUserfields);
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
      if (lineValue.startsWith("Supervisor") || lineValue.startsWith("Restricted")) {
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
