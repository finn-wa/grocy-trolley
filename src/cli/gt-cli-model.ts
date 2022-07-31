import { version } from "@gt/utils/version";
import chalk from "chalk";
import { EOL } from "os";

export type GrocyTrolleyCommand = "import" | "shop" | "stock" | "exit";
export const IMPORT_SOURCES = ["cart", "order", "list", "receipt", "barcodes"] as const;
export type ImportSource = typeof IMPORT_SOURCES[number];
export const STOCK_SOURCES = ["list"];
export type StockSource = typeof STOCK_SOURCES[number];
export const SHOP_CHOICES = ["pns", "grocer"] as const;
export type ShopChoice = typeof SHOP_CHOICES[number];

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
