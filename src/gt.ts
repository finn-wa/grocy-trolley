import prompts from "prompts";
import { ImportSource, ShopChoice, StockSource } from "./cli/gt-cli-model";
import { grocyServices } from "./grocy";
import { GrocyToFoodstuffsConversionService } from "./store/foodstuffs/grocy/export/grocy-to-foodstuffs-conversion-service";
import { foodstuffsImporters } from "./store/foodstuffs/grocy/import";
import { foodstuffsServices } from "./store/foodstuffs/services";

export async function importFrom(choice: ImportSource, opts: { inputFile?: string } = {}) {
  const [foodstuffs, grocy] = await Promise.all([foodstuffsServices(), grocyServices()]);
  const importers = foodstuffsImporters(foodstuffs, grocy);
  if (choice === "receipt") {
    let inputFilePath = opts.inputFile;
    if (!inputFilePath) {
      const filepathRes = await prompts([
        { name: "path", type: "text", message: "Enter filepath" },
      ]);
      inputFilePath = filepathRes.path as string;
    }
    await importers.receiptImporter.importReceipt(inputFilePath);
  } else if (choice === "cart") {
    await importers.cartImporter.importProductsFromCart();
  } else if (choice === "list") {
    await importers.listImporter.selectAndImportList();
  } else if (choice === "order") {
    await importers.orderImporter.importLatestOrders();
  } else if (choice === "barcodes") {
    await importers.barcodeImporter.importFromBarcodeBuddy();
  }
}

export async function stockFrom(choice: StockSource) {
  const [foodstuffs, grocy] = await Promise.all([foodstuffsServices(), grocyServices()]);
  const importers = foodstuffsImporters(foodstuffs, grocy);
  if (choice === "list") {
    return importers.listImporter.selectAndStockList();
  }
  if (choice === "cart") {
    return importers.cartImporter.stockProductsFromCart();
  }
}

export async function shop(choice: ShopChoice): Promise<void> {
  const [foodstuffs, grocy] = await Promise.all([foodstuffsServices(), grocyServices()]);
  const exporter = new GrocyToFoodstuffsConversionService(grocy, foodstuffs);
  return exporter.grocyListToFoodstuffsCart();
}
