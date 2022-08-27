import { AppTokens } from "@gt/app/di";
import {
  ExportDestination,
  EXPORT_DESTINATIONS,
  ImportOptions,
  ImportSource,
} from "@gt/cli/gt-cli-model";
import { GrocyToGrocerConversionService } from "@gt/grocer/grocy/grocy-to-grocer-conversion-service";
import { PromptProvider } from "@gt/prompts/prompt-provider";
import { registerCountdownDependencies } from "@gt/store/countdown/countdown-di";
import { registerFoodstuffsDependencies } from "@gt/store/foodstuffs/foodstuffs-di";
import { GrocyToFoodstuffsConversionService } from "@gt/store/foodstuffs/grocy/export/grocy-to-foodstuffs-conversion-service";
import { FoodstuffsCartImporter } from "@gt/store/foodstuffs/grocy/import/cart-importer";
import { FoodstuffsBarcodeImporter } from "@gt/store/foodstuffs/grocy/import/foodstuffs-barcode-importer";
import { FoodstuffsListImporter } from "@gt/store/foodstuffs/grocy/import/list-importer";
import { FoodstuffsOrderImporter } from "@gt/store/foodstuffs/grocy/import/order-importer";
import { FoodstuffsReceiptImporter } from "@gt/store/foodstuffs/grocy/import/receipt-importer";
import { DependencyContainer, inject, injectable } from "tsyringe";

@injectable()
export class GrocyTrolleyApp {
  // need to be able to inject the prompt provider from the child container
  // maybe SlackSession needs reintroducing, it could hold the user ID and the container
  constructor(
    @inject(AppTokens.appContainer) private readonly appContainer: DependencyContainer,
    @inject(AppTokens.promptProvider) private readonly prompt: PromptProvider
  ) {
    registerFoodstuffsDependencies(this.appContainer);
    registerCountdownDependencies(this.appContainer);
  }

  async importFrom(source?: ImportSource, options: ImportOptions = {}) {
    if (!source) {
      const promptSource = await this.prompt.select("Select import source", [
        { title: "Foodstuffs cart", value: "cart" as const },
        { title: "Foodstuffs orders", value: "order" as const },
        { title: "Foodstuffs list", value: "list" as const },
        { title: "Foodstuffs receipt", value: "receipt" as const },
        { title: "Barcodes", value: "barcodes" as const },
        { title: "Exit", value: null },
      ]);
      if (!promptSource) return;
      source = promptSource;
    }
    if (source === "receipt" || source === "barcodes") {
      let inputFilePath: string | undefined = options.file;
      if (!inputFilePath) {
        const promptFilePath = await this.prompt.text("Enter filepath");
        if (!promptFilePath) return;
        inputFilePath = promptFilePath;
      }
      if (source === "receipt") {
        return this.appContainer.resolve(FoodstuffsReceiptImporter).importReceipt(inputFilePath);
      }
      if (source === "barcodes") {
        return this.appContainer
          .resolve(FoodstuffsBarcodeImporter)
          .importBarcodesFromFile(inputFilePath);
      }
    }
    if (source === "cart") {
      return this.appContainer.resolve(FoodstuffsCartImporter).importProductsFromCart();
    }
    if (source === "list") {
      return this.appContainer.resolve(FoodstuffsListImporter).importList(options.listId);
    }
    if (source === "order") {
      return this.appContainer.resolve(FoodstuffsOrderImporter).importLatestOrders();
    }
  }

  async exportTo(destination?: ExportDestination) {
    if (!destination) {
      const response = await this.prompt.select(
        "Select export destination",
        EXPORT_DESTINATIONS.map((src) => ({ title: src, value: src }))
      );
      if (!response) return;
      destination = response;
    }
    if (destination === "pns") {
      return this.appContainer
        .resolve(GrocyToFoodstuffsConversionService)
        .grocyListToFoodstuffsCart();
    }
    if (destination === "grocer") {
      return this.appContainer.resolve(GrocyToGrocerConversionService).grocyListToGrocerList();
    }
  }

  /**
   * Prompts for a command and then runs it.
   */
  async commandPrompt() {
    const action = await this.prompt.select("Select command", [
      { title: "Import products to Grocy", value: "import" },
      { title: "Export a shopping list from Grocy", value: "export" },
      { title: "Exit", value: null },
    ]);
    if (!action) return;
    if (action === "import") {
      await this.importFrom();
    }
    if (action === "export") {
      await this.exportTo();
    }
  }
}
