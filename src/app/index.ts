import { version } from "@gt/utils/version";
import chalk from "chalk";
import { EOL } from "os";

export type GrocyTrolleyCommand = "import" | "export" | "exit";
export type Vendor = "pns" | "nw" | "cd";

export interface CLIOptions {
  logLevel: string;
  envFilePath: string;
}

const logo = chalk.cyan;
export const appName = "Grocy Trolley";
export const appDescription = "Links Grocy & NZ supermarkets";
export const appLogo = [
  logo("     ╔╗"),
  logo("    ╔╝╚╗"),
  logo("  ╔═╩╗╔╝"),
  logo("  ║╔╗║║") + `    ${chalk.white(appName)} ${chalk.yellow(version)}`,
  logo("  ║╚╝║╚╗") + `   ${chalk.dim(appDescription)}`,
  logo("  ╚═╗╠═╝"),
  logo("  ╔═╝║"),
  logo("  ╚══╝"),
].join(EOL);
