import { registerDefaultDependencies } from "@gt/app/di";
import { ExportDestination, EXPORT_DESTINATIONS } from "@gt/app/export/options";
import { GrocyTrolleyApp } from "@gt/app/gt-app";
import { ImportOptions, ImportSource, IMPORT_SOURCES } from "@gt/app/import/options";
import { dev } from "@gt/dev";
import { GrocyTrolleySlackBot } from "@gt/slack/gt-slack-bot";
import { initEnv } from "@gt/utils/environment";
import { LOG_LEVELS } from "@gt/utils/logger";
import { version } from "@gt/utils/version";
import { Argument, Command, Option, program } from "commander";
import { container } from "tsyringe";
import { CLIOptions, appLogo, appDescription } from "../app";

export async function runGT() {
  registerDefaultDependencies(container);
  return program
    .name("grocy-trolley")
    .summary(appDescription)
    .description(appLogo)
    .version(version)
    .addOption(
      new Option("-l, --log-level <level>")
        .choices(LOG_LEVELS)
        .default("DEBUG")
        .argParser((level) => level.toUpperCase())
        .makeOptionMandatory()
    )
    .option("-e, --env-file <path>", "Path to .env file", ".env")
    .hook("preAction", (command) => {
      const { logLevel, envFilePath } = command.opts<CLIOptions>();
      initEnv({ envFilePath, overrides: { GT_LOG_LEVEL: logLevel } });
    })
    .addCommand(
      new Command("prompt")
        .description("Start an interactive prompt-based version of the CLI")
        .action(async () => {
          await container.resolve(GrocyTrolleyApp).promptRun();
        }),
      { isDefault: true, hidden: true }
    )
    .addCommand(
      new Command("import")
        .alias("i")
        .alias("stock")
        .description("Import products to Grocy")
        // .option("-s, --stock", "When true, imported products will be automatically stocked")
        .addOption(
          new Option("-f, --file <path>", "Path to input file").conflicts(["listId", "barcodes"])
        )
        .addOption(
          new Option("-i, --list-id <uuid>", "ID of list to import").conflicts(["file", "barcodes"])
        )
        .addOption(
          new Option("-b, --barcodes <barcodes>", "List of barcodes to import").conflicts([
            "file",
            "listId",
          ])
        )
        .addArgument(new Argument("[source]", "Import source").choices(IMPORT_SOURCES))
        .action(async (source: ImportSource, options: Omit<ImportOptions, "source" | "vendor">) => {
          await container.resolve(GrocyTrolleyApp).importProducts({ ...options, source });
        })
    )
    .addCommand(
      new Command("export")
        .alias("e")
        .alias("shop")
        .description("Export a shopping list from Grocy")
        .addArgument(
          new Argument("[destination]", "Export destination").choices(EXPORT_DESTINATIONS)
        )
        .action(async (destination: ExportDestination) => {
          await container.resolve(GrocyTrolleyApp).exportShoppingList({ destination });
        })
    )
    .addCommand(
      new Command("slack").description("Starts the slack bot server").action(async () => {
        await container.resolve(GrocyTrolleySlackBot).run();
      })
    )
    .addCommand(new Command("dev").action(dev), { hidden: true })
    .parseAsync();
}
