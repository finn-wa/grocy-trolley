import { Argument, Option, program } from "commander";
import { initEnv } from "utils/environment";
import { grocyServices } from "grocy";
import { exit } from "process";
import prompts from "prompts";
import { foodstuffsServices, GrocyShoppingListExporter } from "store/foodstuffs";
import { foodstuffsImporters } from "store/foodstuffs/product-importer";
import { LOG_LEVELS } from "utils/logger";

const IMPORT_SOURCES = ["cart", "order", "list", "receipt", "barcodes"] as const;
type ImportSource = typeof IMPORT_SOURCES[number];
const STOCK_SOURCES = ["list"];
type StockSource = typeof STOCK_SOURCES[number];

program
  .name("grocy-trolley")
  .description("Links Grocy to PAK'n'SAVE online shopping")
  .version("0.0.1")
  .addOption(
    new Option("-l, --log-level <level>") //
      .choices(LOG_LEVELS)
      .default("DEBUG")
      .makeOptionMandatory()
  )
  .option("-e, --env-file <path>", "Path to .env file", ".env")
  .hook("preAction", (command) => {
    const { logLevel, envFilePath } = command.opts();
    initEnv({ envFilePath, overrides: { GT_LOG_LEVEL: logLevel } });
  });

program
  .command("prompt", { isDefault: true, hidden: true }) //
  .action(commandPrompt);

program
  .command("import")
  .addArgument(new Argument("<source>", "Import source").choices(IMPORT_SOURCES))
  .action((source) => importFrom(source));

program
  .command("stock")
  .addArgument(new Argument("<source>", "Stock source").choices(IMPORT_SOURCES))
  .action((source) => stockFrom(source));

program.command("shop").action(shop);

program.command("dev", { hidden: true }).action(async () => {
  const [foodstuffs, grocy] = await Promise.all([foodstuffsServices(), grocyServices()]);
  const importers = foodstuffsImporters(foodstuffs, grocy);
  await foodstuffs.cartService.getCart();
});

async function commandPrompt() {
  const choices = await prompts([
    {
      name: "command",
      message: "Select a command",
      type: "select",
      choices: [
        { title: "Import products (import)", value: "import" },
        { title: "Export shopping list (shop)", value: "shop" },
        { title: "Exit", value: "exit" },
      ],
    },
    {
      name: "importSource",
      message: "Select an import source",
      type: (prev) => (prev === "import" ? "select" : (null as any)),
      choices: [
        { title: "Foodstuffs cart", value: "cart" },
        { title: "Foodstuffs orders", value: "order" },
        { title: "Foodstuffs list", value: "list" },
        { title: "Foodstuffs receipt", value: "receipt" },
        { title: "Barcode Buddy", value: "barcodes" },
        { title: "Exit", value: "exit" },
      ],
    },
  ]);
  const command = choices["command"] as "import" | "shop" | "exit";
  if (command === "exit" || choices["importSource"] === "exit") {
    return;
  }
  if (command === "import") {
    return importFrom(choices["importSource"] as ImportSource);
  }
  if (command === "shop") {
    return shop();
  }
  throw new Error("Unexpected prompt command: " + command);
}

async function importFrom(choice: ImportSource) {
  const [foodstuffs, grocy] = await Promise.all([foodstuffsServices(), grocyServices()]);
  const importers = foodstuffsImporters(foodstuffs, grocy);

  if (choice === "receipt") {
    const filepathRes = await prompts([{ name: "path", type: "text", message: "Enter filepath" }]);
    return importers.receiptImporter.importReceipt(filepathRes.path as string);
  }
  if (choice === "cart") {
    return importers.cartImporter.importProductsFromCart();
  }
  if (choice === "list") {
    return importers.listImporter.selectAndImportList();
  }
  if (choice === "order") {
    return importers.orderImporter.importLatestOrders();
  }
  if (choice === "barcodes") {
    return importers.barcodeImporter.importFromBarcodeBuddy();
  }
}

async function stockFrom(choice: StockSource) {
  try {
    const [foodstuffs, grocy] = await Promise.all([foodstuffsServices(), grocyServices()]);
    const importers = foodstuffsImporters(foodstuffs, grocy);
    if (choice === "list") {
      return importers.listImporter.selectAndStockList();
    }
  } catch (error) {
    await prompts([{ type: "invisible", name: "prompt", message: "continue?" }]);
  }
}

async function shop(): Promise<void> {
  const [foodstuffs, grocy] = await Promise.all([foodstuffsServices(), grocyServices()]);
  const exporter = new GrocyShoppingListExporter(grocy, foodstuffs);
  return exporter.addShoppingListToCart();
}

program.parseAsync().then(
  () => exit(0),
  (err) => {
    console.error(err);
    exit(1);
  }
);
