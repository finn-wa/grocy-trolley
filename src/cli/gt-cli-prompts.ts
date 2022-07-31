import { importFrom, shop, stockFrom } from "@gt/gt";
import { ifPrevEquals } from "@gt/utils/prompts";
import prompts from "prompts";
import { GrocyTrolleyCommand, ImportSource, ShopChoice, StockSource } from "./gt-cli-model";

export async function promptGT() {
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
