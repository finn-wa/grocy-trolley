import { FoodstuffsGrocyShoppingListExporter } from "@gt/store/foodstuffs/grocy/export/foodstuffs-grocy-shopping-list-exporter";
import { foodstuffsImporters } from "@gt/store/foodstuffs/grocy/import";
import { foodstuffsServices } from "@gt/store/foodstuffs/services";
import { initEnv } from "@gt/utils/environment";
import { Logger, LOG_LEVELS } from "@gt/utils/logger";
import { Argument, Option, program } from "commander";
import { grocyServices } from "grocy";
import { exit } from "process";
import prompts from "prompts";
import { dev } from "./dev";
import { ifPrevEquals } from "./utils/prompts";
import { RequestError } from "./utils/rest";

type GrocyTrolleyCommand = "import" | "shop" | "stock" | "exit";
const IMPORT_SOURCES = ["cart", "order", "list", "receipt", "barcodes"] as const;
type ImportSource = typeof IMPORT_SOURCES[number];
const STOCK_SOURCES = ["list"];
type StockSource = typeof STOCK_SOURCES[number];
const SHOP_CHOICES = ["pns", "grocer"] as const;
type ShopChoice = typeof SHOP_CHOICES[number];

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
      type: ifPrevEquals("import"),
      name: "importSource",
      message: "Select an import source",
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
      type: ifPrevEquals("stock"),
      name: "stockSource",
      message: "Select a stock source",
      choices: [
        { title: "Foodstuffs cart", value: "cart" },
        { title: "Foodstuffs list", value: "list" },
        { title: "Exit", value: "exit" },
      ],
    },
    {
      type: ifPrevEquals("shop"),
      name: "shopChoice",
      message: "Select a shopping list export destination",
      choices: [
        { title: "PAK'nSAVE", value: "pns" },
        { title: "Grocer", value: "grocer" },
        { title: "Exit", value: "exit" },
      ],
    },
  ]);
  const command = choices["command"] as GrocyTrolleyCommand;
  if (
    command === "exit" ||
    choices["importSource"] === "exit" ||
    choices["stockSource"] === "exit" ||
    choices["shopChoice"] === "exit"
  ) {
    return;
  }
  switch (command) {
    case "import":
      return importFrom(choices["importSource"] as ImportSource);
    case "stock":
      return stockFrom(choices["stockSource"] as StockSource);
    case "shop":
      return shop(choices["shopChoice"] as ShopChoice);
    default:
      throw new Error("Unexpected prompt command: " + (command as string));
  }
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

async function shop(choice: ShopChoice): Promise<void> {
  const [foodstuffs, grocy] = await Promise.all([foodstuffsServices(), grocyServices()]);
  const exporter = new FoodstuffsGrocyShoppingListExporter(grocy, foodstuffs);
  return exporter.addShoppingListToCart();
}

interface CLIOptions {
  logLevel: string;
  envFilePath: string;
}
async function main(): Promise<unknown> {
  program
    .name("grocy-trolley")
    .version(version)
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

  program.command("dev", { hidden: true }).action(dev);

  return program.parseAsync();
}

main().then(
  () => exit(0),
  (err) => {
    const logger = new Logger("main");
    if (err instanceof RequestError) {
      err.response.text().then(
        (text) => logger.error(text),
        () => exit(1)
      );
    } else {
      logger.error(err);
      exit(1);
    }
  }
);
