import { Argument, Option, program } from "commander";
import { initEnv } from "env";
import { grocyServices } from "grocy";
import { exit } from "process";
import prompts, { prompt } from "prompts";
import { foodstuffsServices, GrocyShoppingListExporter } from "store/foodstuffs";
import { foodstuffsImporters, FoodstuffsToGrocyConverter } from "store/foodstuffs/product-importer";
import { Logger, LOG_LEVELS, prettyPrint } from "utils/logger";

const IMPORT_SOURCES = ["cart", "order", "list", "receipt", "barcodes"] as const;
type ImportSource = typeof IMPORT_SOURCES[number];

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
  .hook("preAction", (command) => initEnv({ GT_LOG_LEVEL: command.opts().logLevel }));

program
  .command("prompt", { isDefault: true, hidden: true }) //
  .action(commandPrompt);

program
  .command("import")
  .addArgument(new Argument("<source>", "Import source").choices(IMPORT_SOURCES))
  .action((source) => importFrom(source));

program.command("shop").action(shop);

program.command("dev", { hidden: true }).action(async () => {
  const logger = new Logger("dev");
  const grocy = await grocyServices();
  const converter = new FoodstuffsToGrocyConverter(grocy.idMaps);
  const products = await grocy.productService.getProductsWithParsedUserfields();
  for (const product of products.filter((p) => p.userfields.storeMetadata?.PNS)) {
    logger.info(`Updating product ${product.id} - ${product.name}`);
    const toCreate = await converter.forImport(
      product.userfields.storeMetadata?.PNS!,
      "e1925ea7-01bc-4358-ae7c-c6502da5ab12",
      []
    );
    logger.info(prettyPrint(toCreate.quConversions));
    await Promise.all(
      toCreate.quConversions.map((x) =>
        grocy.productService
          .createQuantityUnitConversion({ ...x, product_id: product.id })
          .catch(async (err) => {
            logger.warn(err);
            const choice = await prompts([
              { name: "continue", type: "confirm", message: "continue?" },
            ]);
            if (choice.continue) {
              return null;
            }
            throw err;
          })
      )
    );
  }
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

async function shop(): Promise<void> {
  const foodstuffs = foodstuffsServices();
  const grocy = await grocyServices();
  await foodstuffs.authService.login();
  const exporter = new GrocyShoppingListExporter(
    grocy.productService,
    grocy.shoppingListService,
    foodstuffs.cartService,
    foodstuffs.listService
  );
  return exporter.addShoppingListToCart();
}

program.parseAsync().then(
  () => exit(0),
  (err) => {
    console.error(err);
    exit(1);
  }
);
