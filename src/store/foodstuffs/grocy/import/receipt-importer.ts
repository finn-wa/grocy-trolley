import { ReceiptItem, ReceiptItemiser } from "@gt/receipt-ocr/receipts.model";
import { Logger, prettyPrint } from "@gt/utils/logger";
import { readFile, writeFile } from "fs/promises";
import { GrocyProductService } from "grocy";
import prompts from "prompts";
import { ReceiptScanner } from "receipt-ocr";
import { ListProductRef, toListProductRef } from "../../lists/foodstuffs-list.model";
import { FoodstuffsCartProduct } from "../../models";
import { resultToListRef } from "../../search/foodstuffs-search-agent";
import { FoodstuffsServices } from "../../services";
import { FoodstuffsListImporter } from "./list-importer";

export class FoodstuffsReceiptImporter {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private readonly foodstuffs: Pick<FoodstuffsServices, "listService" | "searchService">,
    private readonly listImporter: FoodstuffsListImporter,
    private readonly scanner: ReceiptScanner,
    private readonly itemiser: ReceiptItemiser,
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
      scannedItems = await this.itemiser.itemise(text);
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
    const listRefs: Record<string, ListProductRef> = {};
    const existingProducts = await this.grocyProductService
      .getProducts()
      .then((products) => products.filter((p) => p.userfields.storeMetadata?.receiptNames?.length));

    for (const item of scannedItems) {
      const existingMatch = existingProducts.find((p) =>
        (p.userfields.storeMetadata?.receiptNames as string[]).includes(item.name)
      );
      if (existingMatch) {
        this.logger.info(`Matched receipt item ${item.name} to Grocy product!`);
        listRefs[item.name] = toListProductRef(
          existingMatch.userfields.storeMetadata?.PNS as FoodstuffsCartProduct
        );
        continue;
      }
      const searchRes = await this.foodstuffs.searchService.searchAndSelectProduct(item.name);
      if (searchRes === null) {
        notFound.push(item);
      } else {
        listRefs[item.name] = resultToListRef(searchRes);
      }
    }
    this.logger.info("Failed to find:\n" + prettyPrint(notFound));
    this.logger.info("Found:\n" + prettyPrint(listRefs));
    const importProducts = await prompts([
      {
        message: "Import products?",
        name: "value",
        type: "confirm",
      },
    ]);
    if (importProducts.value) {
      return this.importReceiptListRefs(listRefs);
    }
  }

  /**
   * Imports resolved receipt items.
   * @param cartRefs map of receipt item name to cart ref
   */
  async importReceiptListRefs(cartRefs: Record<string, ListProductRef>) {
    const listId = await this.foodstuffs.listService.selectList();
    await this.foodstuffs.listService.addProductsToList(listId, Object.values(cartRefs));
    await this.listImporter.importList(listId);
    const productsByPnsId = await this.listImporter.getProductsByFoodstuffsId();
    for (const [name, ref] of Object.entries(cartRefs)) {
      const product = productsByPnsId[ref.productId.replaceAll("_", "-").replace(/(PNS|NW)$/, "")];
      if (!product) {
        this.logger.error(`No product found for ${ref.productId} / ${name}`);
        continue;
      }
      const userfields = product.userfields;
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
      await this.grocyProductService.patchProduct(product.id, { userfields: updatedUserfields });
    }
  }
}
