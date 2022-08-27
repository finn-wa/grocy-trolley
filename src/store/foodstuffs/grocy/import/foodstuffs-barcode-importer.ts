import { GrocerApiService } from "@gt/grocer/api/grocer-api-service";
import { GrocerStoreService } from "@gt/grocer/stores/grocer-store-service";
import { ReceiptItem } from "@gt/receipt-ocr/receipts.model";
import { shortDate } from "@gt/utils/date";
import { Logger, prettyPrint } from "@gt/utils/logger";
import { readFile } from "fs/promises";
import { Lifecycle, scoped } from "tsyringe";
import { FoodstuffsReceiptImporter } from "./receipt-importer";

@scoped(Lifecycle.ContainerScoped)
export class FoodstuffsBarcodeImporter {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private readonly receiptImporter: FoodstuffsReceiptImporter,
    private readonly grocerStoreService: GrocerStoreService,
    private readonly grocerApiService: GrocerApiService
  ) {}

  async importBarcodes(barcodes: string[]) {
    const stores = await this.grocerStoreService.promptForStores();
    if (!stores) return;
    const storeIds = stores.map((store) => store.id);
    const items: ReceiptItem[] = [];
    const notFound: string[] = [];
    for (const barcode of barcodes) {
      try {
        const product = await this.grocerApiService.getProductForBarcode({
          barcode,
          stores: storeIds,
        });
        items.push({ name: product.name, amount: product.prices[0].original_price ?? 0 });
      } catch (error) {
        this.logger.warn(error);
        notFound.push(barcode);
      }
    }
    this.logger.info(`Found ${items.length} items, failed to find: ${prettyPrint(notFound)}`);
    const cacheKey = "barcodes";
    const resolvedItems = await this.receiptImporter.resolveScannedItems(items, cacheKey);
    return this.receiptImporter.promptImportReceiptListRefs(
      resolvedItems,
      `${shortDate(new Date())} barcodes`
    );
  }

  async importBarcodesFromFile(filePath: string) {
    const barcodes = await this.readBarcodesFromFile(filePath);
    return this.importBarcodes(barcodes);
  }

  async readBarcodesFromFile(filePath: string): Promise<string[]> {
    const contents = await readFile(filePath, { encoding: "utf8" });
    // A parser so dumb it should work for any format as long each barcode is on a separate line
    return contents
      .split(/\n/)
      .map((line) => line.replaceAll(/\D+/g, ""))
      .filter((line) => line.length > 0);
  }
}
