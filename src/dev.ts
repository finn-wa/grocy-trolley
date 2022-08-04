/* eslint-disable */
import "@abraham/reflection";
import { container } from "tsyringe";
import { registerAppDependencies } from "./app";
import { registerFoodstuffsDependencies } from "./store/foodstuffs/foodstuffs-di";
import { FoodstuffsBarcodeImporter } from "./store/foodstuffs/grocy/import/foodstuffs-barcode-importer";

async function generate() {}

export async function dev() {
  const items = [
    { barcode: "9421025564598", name: "Vitamin c" },
    { barcode: "9414322021840", name: "paracetamol" },
    { barcode: "9310059064405", name: "Sudafed" },
    { barcode: "9415559050368", name: "choc almonds" },
    { barcode: "9415077100385", name: "Jelly fruit" },
    { barcode: "8003440996645", name: "fruitella" },
    { barcode: "9557062500449", name: "corntos cheese" },
    { barcode: "051325114880", name: "corntos spicy" },
    { barcode: "9403110042105", name: "made simple bar" },
    { barcode: "9403110042648", name: "nut butter bar" },
    { barcode: "9421905756006", name: "oat milk barista" },
    { barcode: "089686010831", name: "noodles mi goreng" },
    { barcode: "089686180695", name: "noodles mi goreng bbq chicken" },
    { barcode: "9421901492021", name: "coffee x2" },
    { barcode: "9414987011750", name: "bread" },
    { barcode: "9414223006403", name: "paper towels" },
  ];

  registerAppDependencies(container);
  registerFoodstuffsDependencies(container);
  const barcodeImporter = container.resolve(FoodstuffsBarcodeImporter);
  await barcodeImporter.importBarcodes(items.map((item) => item.barcode));
}

/* eslint-enable */
