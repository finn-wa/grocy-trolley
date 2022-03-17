import { Argument, Option, program } from "commander";
import { initEnv } from "env";
import { grocyServices } from "grocy";
import { exit } from "process";
import prompts from "prompts";
import { foodstuffsServices } from "store/foodstuffs";
import { foodstuffsImporters } from "store/foodstuffs/product-importer";
import { LogLevelString, LOG_LEVELS } from "utils/logger";

const IMPORT_SOURCES = ["cart", "order", "list", "receipt", "barcodes"] as const;
type ImportSource = typeof IMPORT_SOURCES[number];

program
  .name("grocy-trolley")
  .description("Links Grocy to PAK'n'SAVE online shopping")
  .version("0.0.1")
  .addOption(
    new Option("-l, --log-level <level>").choices(LOG_LEVELS).default("DEBUG").makeOptionMandatory()
  );

program.command("prompt", { isDefault: true, hidden: true }).action(promptForAction);

program
  .command("import")
  .addArgument(new Argument("<source>", "Import source").choices(IMPORT_SOURCES))
  .action((source) => importFrom(source));

async function promptForAction() {
  const response = await prompts([
    {
      name: "action",
      message: "Select an action",
      type: "select",
      choices: [
        { title: "Import from cart", value: "cart" },
        { title: "Import latest orders", value: "order" },
        { title: "Import from list", value: "list" },
        { title: "Import from receipt", value: "receipt" },
        { title: "Get barcodes from BB", value: "barcodes" },
        { title: "Exit", value: "exit" },
      ],
    },
  ]);
  const choice = response["action"] as ImportSource | "exit";
  if (choice === "exit") {
    return;
  }
  return importFrom(choice);
}

async function importFrom(choice: ImportSource) {
  const opts = program.opts() as { logLevel: LogLevelString };
  initEnv({ GT_LOG_LEVEL: opts.logLevel });

  const foodstuffs = foodstuffsServices();
  const grocy = await grocyServices();
  const importers = foodstuffsImporters(foodstuffs, grocy);
  await foodstuffs.authService.login();

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

program.parseAsync().then(
  () => exit(0),
  (err) => {
    console.error(err);
    exit(1);
  }
);
