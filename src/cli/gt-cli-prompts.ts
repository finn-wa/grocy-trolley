import { exportTo, importFrom } from "@gt/app";
import { ifPrevEquals } from "@gt/utils/prompts";
import prompts from "prompts";
import { ExportDestination, GrocyTrolleyCommand, ImportSource } from "./gt-cli-model";

export async function promptGT() {
  const choices = await prompts([
    {
      name: "command",
      message: "Select a command",
      type: "select",
      choices: [
        { title: "Import products (import)", value: "import" },
        { title: "Export shopping list (export)", value: "export" },
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
        { title: "Exit", value: "exit" },
      ],
    },
    {
      type: ifPrevEquals("export"),
      name: "destination",
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
    choices["destination"] === "exit"
  ) {
    return;
  }
  switch (command) {
    case "import":
      return importFrom(choices["importSource"] as ImportSource);
    case "export":
      return exportTo(choices["destination"] as ExportDestination);
    default:
      throw new Error("Unexpected prompt command: " + (command as string));
  }
}
