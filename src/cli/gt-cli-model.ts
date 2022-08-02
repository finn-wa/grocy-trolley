import { version } from "@gt/utils/version";
import chalk from "chalk";
import { EOL } from "os";

export type GrocyTrolleyCommand = "import" | "export" | "exit";

export const IMPORT_SOURCES = ["cart", "order", "list", "receipt"] as const;
export type ImportSource = typeof IMPORT_SOURCES[number];
export interface ImportOptions {
  // stock?: boolean;
  listId?: ImportSource;
  file?: string;
}

export const EXPORT_DESTINATIONS = ["pns", "grocer"] as const;
export type ExportDestination = typeof EXPORT_DESTINATIONS[number];

export interface CLIOptions {
  logLevel: string;
  envFilePath: string;
}

const logo = chalk.cyan;
export const gtLogo = [
  logo("     ╔╗"),
  logo("    ╔╝╚╗"),
  logo("  ╔═╩╗╔╝"),
  logo("  ║╔╗║║") + "    " + chalk.white("Grocy Trolley ") + chalk.yellow(version),
  logo("  ║╚╝║╚╗") + "   " + chalk.dim("Links Grocy & NZ supermarkets"),
  logo("  ╚═╗╠═╝"),
  logo("  ╔═╝║"),
  logo("  ╚══╝"),
].join(EOL);
