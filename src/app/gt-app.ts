import { AppTokens } from "@gt/app/di";
import { GrocyToGrocerConversionService } from "@gt/grocer/grocy/grocy-to-grocer-conversion-service";
import { validationErrorMsg } from "@gt/jtd/ajv";
import { PromptProvider } from "@gt/prompts/prompt-provider";
import { TaggunReceiptScanner } from "@gt/receipt-ocr/taggun/taggun-receipt-scanner";
import { registerCountdownDependencies } from "@gt/store/countdown/countdown-di";
import { registerFoodstuffsDependencies } from "@gt/store/foodstuffs/foodstuffs-di";
import { GrocyToFoodstuffsConversionService } from "@gt/store/foodstuffs/grocy/export/grocy-to-foodstuffs-conversion-service";
import { FoodstuffsCartImporter } from "@gt/store/foodstuffs/grocy/import/cart-importer";
import { FoodstuffsBarcodeImporter } from "@gt/store/foodstuffs/grocy/import/foodstuffs-barcode-importer";
import { FoodstuffsListImporter } from "@gt/store/foodstuffs/grocy/import/list-importer";
import { FoodstuffsOrderImporter } from "@gt/store/foodstuffs/grocy/import/order-importer";
import { FoodstuffsReceiptImporter } from "@gt/store/foodstuffs/grocy/import/receipt-importer";
import { DependencyContainer, inject, injectable } from "tsyringe";
import { ExportDestination, ExportOptions, EXPORT_DESTINATIONS } from "./export/options";
import { getImportOptionsSchema, ImportOptions, ImportSource } from "./import/options";

@injectable()
export class GrocyTrolleyApp {
  constructor(
    @inject(AppTokens.childContainer) private readonly appContainer: DependencyContainer,
    @inject(AppTokens.promptProvider) private readonly prompt: PromptProvider
  ) {
    registerFoodstuffsDependencies(this.appContainer);
    registerCountdownDependencies(this.appContainer);
    this.appContainer.register(AppTokens.receiptScanner, {
      useClass: TaggunReceiptScanner,
    });
  }

  async importProducts(options: Partial<ImportOptions> = {}) {
    const opts: ImportOptions = {
      source: options.source ?? (await this.promptForImportSource()),
      vendor: "pns",
    };
    if (opts.source === "receipt") {
      return this.appContainer.resolve(FoodstuffsReceiptImporter).importReceipt(opts.file);
    }
    if (opts.source === "barcodes") {
      return this.appContainer.resolve(FoodstuffsBarcodeImporter).importBarcodesFromFile(opts.file);
    }
    if (opts.source === "cart") {
      return this.appContainer.resolve(FoodstuffsCartImporter).importProductsFromCart();
    }
    if (opts.source === "list") {
      return this.appContainer.resolve(FoodstuffsListImporter).importList(opts.listId);
    }
    if (opts.source === "order") {
      return this.appContainer.resolve(FoodstuffsOrderImporter).importLatestOrders();
    }
    throw new Error(
      `Unexpected options body: ${validationErrorMsg(getImportOptionsSchema(), opts)}`
    );
  }

  private async promptForImportSource(): Promise<ImportSource> {
    const source = await this.prompt.select(
      "Select import source",
      [
        { title: "Foodstuffs cart", value: "cart" as const },
        { title: "Foodstuffs orders", value: "order" as const },
        { title: "Foodstuffs list", value: "list" as const },
        { title: "Foodstuffs receipt", value: "receipt" as const },
        { title: "Barcodes", value: "barcodes" as const },
      ],
      { includeExitOption: true }
    );
    if (!source) {
      throw new Error("No import source provided");
    }
    return source;
  }

  async exportShoppingList(options: Partial<ExportOptions> = {}) {
    const destination = options.destination ?? (await this.promptForExportDestination());
    if (destination === "pns") {
      return this.appContainer
        .resolve(GrocyToFoodstuffsConversionService)
        .grocyListToFoodstuffsCart();
    }
    if (destination === "grocer") {
      return this.appContainer.resolve(GrocyToGrocerConversionService).grocyListToGrocerList();
    }
  }

  private async promptForExportDestination(): Promise<ExportDestination> {
    const destination = await this.prompt.select(
      "Select export destination",
      EXPORT_DESTINATIONS.map((src) => ({ title: src, value: src })),
      { includeExitOption: true }
    );
    if (!destination) {
      throw new Error("No export destination specified");
    }
    return destination;
  }

  /**
   * Prompts for a command and then runs it.
   */
  async promptRun() {
    const action = await this.prompt.select(
      "Select command",
      [
        { title: "Import products to Grocy", value: "import" },
        { title: "Export a shopping list from Grocy", value: "export" },
      ],
      { includeExitOption: true }
    );
    if (action === "import") {
      await this.importProducts();
    }
    if (action === "export") {
      await this.exportShoppingList();
    }
  }
}
