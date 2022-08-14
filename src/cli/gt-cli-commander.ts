import { dev } from "@gt/dev";
import { exportTo, importFrom } from "@gt/app";
import { initEnv } from "@gt/utils/environment";
import { LOG_LEVELS } from "@gt/utils/logger";
import { version } from "@gt/utils/version";
import { Argument, Command, Option, program } from "commander";
import {
  CLIOptions,
  ExportDestination,
  EXPORT_DESTINATIONS,
  gtLogo,
  ImportOptions,
  ImportSource,
  IMPORT_SOURCES,
} from "./gt-cli-model";
import { promptGT } from "./gt-cli-prompts";

export async function runGT() {
  program
    .name("grocy-trolley")
    .description(gtLogo)
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
        .action(async () => await promptGT()),
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
        .action(async (source: ImportSource, options: ImportOptions) => {
          await importFrom(source, options);
        })
    )
    .addCommand(
      new Command("export")
        .alias("e")
        .alias("shop")
        .description("Export a shopping list from Grocy to Foodstuffs or Grocer")
        .addArgument(
          new Argument("[destination]", "Export destination").choices(EXPORT_DESTINATIONS)
        )
        .action((destination: ExportDestination) => exportTo(destination))
    )
    .addCommand(new Command("dev").action(dev), { hidden: true });
  return program.parseAsync();
}
