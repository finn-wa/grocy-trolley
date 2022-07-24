import { GrocyProductService } from "@gt/grocy/products/grocy-product-service";
import { ReceiptItem, ReceiptItemiser } from "@gt/receipt-ocr/receipts.model";
import { CacheService, getCacheDir } from "@gt/utils/cache";
import { Logger, prettyPrint } from "@gt/utils/logger";
import dedent from "dedent";
import path, { basename } from "path";
import prompts from "prompts";
import { ReceiptScanner } from "receipt-ocr";
import { ListProductRef, toListProductRef } from "../../lists/foodstuffs-list.model";
import { FoodstuffsCartProduct } from "../../models";
import { resultToListRef } from "../../search/foodstuffs-search-agent";
import { FoodstuffsServices } from "../../services";
import { FoodstuffsListImporter } from "./list-importer";

export class FoodstuffsReceiptImporter {
  private readonly logger = new Logger(this.constructor.name);
  private readonly scanCache = new CacheService<Record<string, ReceiptItem[]>>(
    "foodstuffs-receipt-importer/scanned"
  );
  private readonly resolvedItemCache = new CacheService<Record<string, ResolvedProductRefs>>(
    "foodstuffs-receipt-importer/resolved"
  );

  constructor(
    private readonly foodstuffs: Pick<FoodstuffsServices, "listService" | "searchService">,
    private readonly listImporter: FoodstuffsListImporter,
    private readonly scanner: ReceiptScanner,
    private readonly itemiser: ReceiptItemiser,
    private readonly grocyProductService: GrocyProductService
  ) {}

  /**
   * Import receipt items to a grocy list. Scans the receipt, resolves the items
   * to FoodstuffsProducts, adds the products to a list, then imports the list.
   *
   * @param filepath Path to a receipt image
   * @returns object indicating whether import was successful or not
   */
  async importReceipt(filepath: string): Promise<{ success: boolean }> {
    // check for in-progress import in cache
    const cacheKey = this.getCacheKey(filepath);
    const cachedResolvedItems = await this.resolvedItemCache.get(cacheKey);
    if (cachedResolvedItems) {
      console.log("Found cached resolved items");
      const response = await this.promptImportReceiptListRefs(cachedResolvedItems, cacheKey);
      if (response.success) {
        return response;
      }
      // user did not want to import cached resolved items, continue to scan receipt
    }
    const scannedItems = await this.promptScanReceipt(filepath);
    if (!scannedItems || scannedItems.length === 0) {
      return { success: false };
    }
    const resolvedItems = await this.resolveScannedItems(scannedItems, cacheKey);
    return this.promptImportReceiptListRefs(resolvedItems, cacheKey);
  }

  /**
   * Gets scanned items from cache (if user confirms) or scans the receipt.
   * @param receiptFilepath Path to a receipt image
   * @returns an array of receipt items, or null if the user cancelled.
   */
  async promptScanReceipt(receiptFilepath: string): Promise<ReceiptItem[] | null> {
    const cacheKey = this.getCacheKey(receiptFilepath);
    const cacheFilepath = path.join(
      getCacheDir(),
      this.scanCache.relativeCacheDir,
      cacheKey + ".json"
    );
    const cachedScannedItems = await this.scanCache.get(cacheKey);
    if (cachedScannedItems !== null) {
      console.log(prettyPrint(cachedScannedItems));
      const confirm = await prompts([
        {
          name: "useCache",
          message: dedent`
            Use cached scanned items? Amend file as needed before continuing:\n${cacheFilepath}`,
          type: "confirm",
        },
      ]);
      if (confirm.useCache) {
        return this.scanCache.get(cacheKey);
      }
    }
    const text = await this.scanner.scan(receiptFilepath);
    const scannedItems = await this.itemiser.itemise(text);
    await this.scanCache.set(cacheKey, scannedItems);
    console.log(prettyPrint(scannedItems));
    const response = await prompts({
      message: `Import these items? Amend file as needed before continuing:\n${cacheFilepath}`,
      name: "continue",
      type: "confirm",
    });
    if (response.continue) {
      return this.scanCache.get(cacheKey);
    }
    return null;
  }

  /**
   * Converts a filepath to a cache key for that file.
   * @param receiptFilepath Path to a receipt image
   * @returns A key to use for caching scanned/resolved items
   */
  private getCacheKey(receiptFilepath: string): string {
    const receiptBasename = basename(receiptFilepath);
    return receiptBasename.substring(0, receiptBasename.lastIndexOf("."));
  }

  /**
   * Resolves scanned receipt items to Foodstuffs products.
   * @param scannedItems An array of scanned items
   * @param cacheKey Optional key to use for caching resolved items
   * @returns resolved foodstuffs products
   */
  async resolveScannedItems(
    scannedItems: ReceiptItem[],
    cacheKey?: string
  ): Promise<ResolvedProductRefs> {
    const notFound: ReceiptItem[] = [];
    const listRefs: Record<string, ListProductRef> = {};
    const existingProducts = await this.grocyProductService
      .getAllProducts()
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
    const resolvedItems = { listRefs, notFound };
    if (cacheKey) {
      await this.resolvedItemCache.set(cacheKey, resolvedItems);
    }
    return resolvedItems;
  }

  /**
   * Confirms with user whether to import a list of resolved items, and if so,
   * calls importReceiptListRefs.
   * @param items Resolved items to import
   * @param newListName Name of list to create and add resolved items to. If not
   *    provided, the user will be prompted to enter a name.
   * @returns Object indicating whether import was successful or not
   */
  async promptImportReceiptListRefs(
    items: ResolvedProductRefs,
    newListName?: string
  ): Promise<{ success: boolean }> {
    const { listRefs, notFound } = items;
    if (notFound.length > 0) {
      this.logger.info("Failed to find:\n" + prettyPrint(notFound));
    }
    this.logger.info("Found:\n" + prettyPrint(listRefs));
    const importProducts = await prompts([
      {
        message: "Import resolved products?",
        name: "confirm",
        type: "confirm",
      },
    ]);
    if (!importProducts.confirm) {
      return { success: false };
    }
    const { listId } = newListName
      ? await this.foodstuffs.listService.createList(newListName)
      : await this.foodstuffs.listService.createListWithNamePrompt();
    await this.importReceiptListRefs(listRefs, listId);
    return { success: true };
  }

  /**
   * Imports resolved receipt items by adding them to a list and invoking the list importer.
   * @param listRefs map of receipt item name to list ref
   * @param listId ID of list to use for import
   */
  async importReceiptListRefs(listRefs: Record<string, ListProductRef>, listId: string) {
    await this.foodstuffs.listService.addProductsToList(listId, Object.values(listRefs));
    await this.listImporter.importList(listId);
    this.logger.info("Adding receipt metadata to imported items...");
    const productsByPnsId = await this.listImporter.getProductsByFoodstuffsId();
    for (const [name, ref] of Object.entries(listRefs)) {
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

interface ResolvedProductRefs {
  readonly listRefs: Record<string, ListProductRef>;
  readonly notFound: ReceiptItem[];
}
