import {
  FoodstuffsListProduct,
  foodstuffsServices,
  GrocyShoppingListExporter,
} from "@gt/store/foodstuffs";
import { foodstuffsImporters } from "@gt/store/foodstuffs/product-importer";
import { initEnv } from "@gt/utils/environment";
import { Logger, LOG_LEVELS } from "@gt/utils/logger";
import { Argument, Option, program } from "commander";
import { readFile } from "fs/promises";
import { grocyServices } from "grocy";
import { exit } from "process";
import prompts from "prompts";

const IMPORT_SOURCES = ["cart", "order", "list", "receipt", "barcodes"] as const;
type ImportSource = typeof IMPORT_SOURCES[number];
const STOCK_SOURCES = ["list"];
type StockSource = typeof STOCK_SOURCES[number];

async function commandPrompt() {
  const choices = await prompts([
    {
      name: "command",
      message: "Select a command",
      type: "select",
      choices: [
        { title: "Import products (import)", value: "import" },
        { title: "Stock products (stock)", value: "stock" },
        { title: "Export shopping list (shop)", value: "shop" },
        { title: "Exit", value: "exit" },
      ],
    },
    {
      name: "importSource",
      message: "Select an import source",
      type: (prev) => (prev === "import" ? "select" : null),
      choices: [
        { title: "Foodstuffs cart", value: "cart" },
        { title: "Foodstuffs orders", value: "order" },
        { title: "Foodstuffs list", value: "list" },
        { title: "Foodstuffs receipt", value: "receipt" },
        { title: "Barcode Buddy", value: "barcodes" },
        { title: "Exit", value: "exit" },
      ],
    },
    {
      name: "stockSource",
      message: "Select a stock source",
      type: (prev) => (prev === "stock" ? "select" : null),
      choices: [
        { title: "Foodstuffs cart", value: "cart" },
        { title: "Foodstuffs list", value: "list" },
        { title: "Exit", value: "exit" },
      ],
    },
  ]);
  const command = choices["command"] as "import" | "shop" | "stock" | "exit";
  if (
    command === "exit" ||
    choices["importSource"] === "exit" ||
    choices["stockSource"] === "exit"
  ) {
    return;
  }
  if (command === "import") {
    return importFrom(choices["importSource"] as ImportSource);
  }
  if (command === "stock") {
    return stockFrom(choices["stockSource"] as StockSource);
  }
  if (command === "shop") {
    return shop();
  }
  throw new Error("Unexpected prompt command: " + (command as string));
}

async function importFrom(choice: ImportSource, opts: { inputFile?: string } = {}) {
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
    return importers.receiptImporter.importReceipt(inputFilePath);
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
  const [foodstuffs, grocy] = await Promise.all([foodstuffsServices(), grocyServices()]);
  const importers = foodstuffsImporters(foodstuffs, grocy);
  if (choice === "list") {
    return importers.listImporter.selectAndStockList();
  }
  if (choice === "cart") {
    return importers.cartImporter.stockProductsFromCart();
  }
}

async function shop(): Promise<void> {
  const [foodstuffs, grocy] = await Promise.all([foodstuffsServices(), grocyServices()]);
  const exporter = new GrocyShoppingListExporter(grocy, foodstuffs);
  return exporter.addShoppingListToCart();
}

interface CLIOptions {
  logLevel: string;
  envFilePath: string;
}
async function main(): Promise<unknown> {
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
      const { logLevel, envFilePath } = command.opts<CLIOptions>();
      initEnv({ envFilePath, overrides: { GT_LOG_LEVEL: logLevel } });
    });

  program
    .command("prompt", { isDefault: true, hidden: true })
    .description("Start an interactive prompt-based version of the CLI")
    .action(commandPrompt);

  program
    .command("import")
    .description("Import products to Grocy")
    .addArgument(new Argument("<source>", "Import source").choices(IMPORT_SOURCES))
    .option("-i, --input-file [path]", "Path to receipt file")
    .action((source, options) =>
      importFrom(source as ImportSource, options as { inputFile?: string })
    );

  program
    .command("stock")
    .description("Stock products in Grocy")
    .addArgument(new Argument("<source>", "Stock source").choices(IMPORT_SOURCES))
    .action((source) => stockFrom(source as StockSource));

  program
    .command("shop")
    .description("Export a shopping list from Grocy to Foodstuffs")
    .action(shop);

  /* eslint-disable */
  program.command("dev", { hidden: true }).action(async () => {
    const listStr = await readFile("./cart.json", { encoding: "utf-8" });
    const products = JSON.parse(listStr).products as FoodstuffsListProduct[];
    const foodstuffs = await foodstuffsServices();
    const listId = await foodstuffs.listService.selectList();
    await foodstuffs.listService.updateList({ listId, products });
  });
  /* eslint-enable */

  return program.parseAsync();
}

main().then(
  () => exit(0),
  (err) => {
    new Logger("main").error(err);
    exit(1);
  }
);
