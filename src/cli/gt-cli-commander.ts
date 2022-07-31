import { dev } from "@gt/dev";
import { importFrom, shop, stockFrom } from "@gt/gt";
import { initEnv } from "@gt/utils/environment";
import { LOG_LEVELS } from "@gt/utils/logger";
import { version } from "@gt/utils/version";
import chalk from "chalk";
import { Argument, Option, program } from "commander";
import { CLIOptions, gtLogo, ImportSource, IMPORT_SOURCES, StockSource } from "./gt-cli-model";
import { promptGT } from "./gt-cli-prompts";

export function runGT() {
  const logo = chalk.cyan;
  program
    .name("grocy-trolley")
    .description(gtLogo)
    .version(version)
    .addOption(
      new Option("-l, --log-level <level>")
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
    .action(promptGT);

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
