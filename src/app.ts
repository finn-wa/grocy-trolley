// Enable reflection for tsyringe
import "@abraham/reflection";

import prompts from "prompts";
import { container, DependencyContainer } from "tsyringe";
import { AppTokens } from "./app-tokens";
import {
  ExportDestination,
  EXPORT_DESTINATIONS,
  ImportOptions,
  ImportSource,
  IMPORT_SOURCES,
} from "./cli/gt-cli-model";
import { GrocyToGrocerConversionService } from "./grocer/grocy/grocy-to-grocer-conversion-service";
import { TaggunReceiptScanner } from "./receipt-ocr/taggun/taggun-receipt-scanner";
import { registerFoodstuffsDependencies } from "./store/foodstuffs/foodstuffs-di";
import { GrocyToFoodstuffsConversionService } from "./store/foodstuffs/grocy/export/grocy-to-foodstuffs-conversion-service";
import { FoodstuffsBarcodeImporter } from "./store/foodstuffs/grocy/import/foodstuffs-barcode-importer";
import { FoodstuffsCartImporter } from "./store/foodstuffs/grocy/import/cart-importer";
import { FoodstuffsListImporter } from "./store/foodstuffs/grocy/import/list-importer";
import { FoodstuffsOrderImporter } from "./store/foodstuffs/grocy/import/order-importer";
import { FoodstuffsReceiptImporter } from "./store/foodstuffs/grocy/import/receipt-importer";
import { browserFactory } from "./store/shared/rest/browser";

export function registerAppDependencies(_container: DependencyContainer) {
  return _container
    .register(AppTokens.browserLoader, { useValue: browserFactory({ headless: false }) })
    .registerSingleton(AppTokens.receiptScanner, TaggunReceiptScanner);
}

function initAppContainer() {
  registerAppDependencies(container);
  registerFoodstuffsDependencies(container);
}

export async function importFrom(source?: ImportSource, options: ImportOptions = {}) {
  initAppContainer();
  if (!source) {
    const response = await prompts({
      message: "Select import source",
      type: "select",
      choices: IMPORT_SOURCES.map((src) => ({ title: src, value: src })),
      name: "source",
    });
    source = response.source as ImportSource;
  }
  if (source === "receipt" || source === "barcodes") {
    let inputFilePath: string | undefined = options.file;
    if (!inputFilePath) {
      const filepathRes = await prompts({ name: "path", type: "text", message: "Enter filepath" });
      inputFilePath = filepathRes.path as string;
    }
    if (source === "receipt") {
      return container.resolve(FoodstuffsReceiptImporter).importReceipt(inputFilePath);
    }
    if (source === "barcodes") {
      return container.resolve(FoodstuffsBarcodeImporter).importBarcodesFromFile(inputFilePath);
    }
  }
  if (source === "cart") {
    return container.resolve(FoodstuffsCartImporter).importProductsFromCart();
  }
  if (source === "list") {
    return container.resolve(FoodstuffsListImporter).importList(options.listId);
  }
  if (source === "order") {
    return container.resolve(FoodstuffsOrderImporter).importLatestOrders();
  }
}

export async function exportTo(destination?: ExportDestination): Promise<void> {
  initAppContainer();
  if (!destination) {
    const response = await prompts({
      message: "Select export destination",
      type: "select",
      choices: EXPORT_DESTINATIONS.map((src) => ({ title: src, value: src })),
      name: "destination",
    });
    destination = response.destination as ExportDestination;
  }
  if (destination === "pns") {
    return container.resolve(GrocyToFoodstuffsConversionService).grocyListToFoodstuffsCart();
  }
  if (destination === "grocer") {
    return container.resolve(GrocyToGrocerConversionService).grocyListToGrocerList();
  }
}
