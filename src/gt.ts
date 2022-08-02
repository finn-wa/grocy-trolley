import prompts from "prompts";
import {
  ExportDestination,
  EXPORT_DESTINATIONS,
  ImportOptions,
  ImportSource,
  IMPORT_SOURCES,
} from "./cli/gt-cli-model";
import { GrocyToGrocerConversionService } from "./grocer/grocy/grocy-to-grocer-conversion-service";
import { GrocerSearchService } from "./grocer/search/grocer-search-service";
import { GrocerStoreService } from "./grocer/stores/grocer-store-service";
import { GrocerUserAgent } from "./grocer/user-agent/grocer-user-agent";
import { grocyServices } from "./grocy";
import { GrocyToFoodstuffsConversionService } from "./store/foodstuffs/grocy/export/grocy-to-foodstuffs-conversion-service";
import { foodstuffsImporters } from "./store/foodstuffs/grocy/import";
import { foodstuffsServices } from "./store/foodstuffs/services";
import { getBrowser } from "./store/shared/rest/browser";

export async function importFrom(source?: ImportSource, options: ImportOptions = {}) {
  if (!source) {
    const response = await prompts({
      message: "Select import source",
      type: "select",
      choices: IMPORT_SOURCES.map((src) => ({ title: src, value: src })),
      name: "source",
    });
    source = response.source as ImportSource;
  }
  const [foodstuffs, grocy] = await Promise.all([foodstuffsServices(), grocyServices()]);
  const importers = foodstuffsImporters(foodstuffs, grocy);
  if (source === "receipt") {
    let inputFilePath: string | undefined = options.file;
    if (!inputFilePath) {
      const filepathRes = await prompts([
        { name: "path", type: "text", message: "Enter filepath" },
      ]);
      inputFilePath = filepathRes.path as string;
    }
    await importers.receiptImporter.importReceipt(inputFilePath);
  } else if (source === "cart") {
    await importers.cartImporter.importProductsFromCart();
  } else if (source === "list") {
    const listId = options.listId ?? (await foodstuffs.listService.selectList());
    await importers.listImporter.importList(listId);
  } else if (source === "order") {
    await importers.orderImporter.importLatestOrders();
  }
}

export async function exportTo(destination?: ExportDestination): Promise<void> {
  if (!destination) {
    const response = await prompts({
      message: "Select export destination",
      type: "select",
      choices: EXPORT_DESTINATIONS.map((src) => ({ title: src, value: src })),
      name: "destination",
    });
    destination = response.destination as ExportDestination;
  }
  const grocy = await grocyServices();
  if (destination === "pns") {
    const foodstuffs = await foodstuffsServices();
    const exporter = new GrocyToFoodstuffsConversionService(grocy, foodstuffs);
    return exporter.grocyListToFoodstuffsCart();
  }
  if (destination === "grocer") {
    const grocer = new GrocyToGrocerConversionService(
      grocy,
      new GrocerSearchService(),
      new GrocerStoreService(),
      new GrocerUserAgent(() => getBrowser({ headless: false }))
    );
    return grocer.grocyListToGrocerList();
  }
}
