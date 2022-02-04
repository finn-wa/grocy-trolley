import fetch from "node-fetch";
import { exit } from "process";
import { GrocyStore } from "./grocy/grocy";
import { EnvParser } from "./env";

interface CreateGrocyProduct {
  /** Product name */
  name: string;
  /** HTML formatted description */
  description: string;
  /** Location ID, e.g. ID for Kitchen Pantry */
  location_id: number;
  /** Quantity unit ID for purchases */
  qu_id_purchase: number;
  /** Quantity unit ID for stock  */
  qu_id_stock: number;
  /** Default size in units of purchase, e.g. 400 for 400g */
  qu_factor_purchase_to_stock: number;
  /** Product category, e.g. ID for Fruit */
  product_group_id?: number;
  /** Shopping location, e.g. ID for PAK'n'SAVE Royal Oak */
  shopping_location_id?: number;
  /** Can contain multiple barcodes separated by comma */
  barcode?: string;
  /** Disable stock fulfillment checking for this ingredient */
  not_check_stock_fulfillment_for_recipes?: number;
  /** Enter total weight of stock on purchase */
  enable_tare_weight_handling?: number;
  /** Tare weight */
  tare_weight?: number;
  /** Minimum stock amount */
  min_stock_amount?: number;
  default_best_before_days?: number;
  default_best_before_days_after_open?: number;
  picture_file_name?: string;
  /** Key/value pairs of userfields */
  userfields?: Record<string, string | number>;
}

async function main() {
  const env = new EnvParser("src/resources/env/env.json").env;
  const grocy = new GrocyStore(env);

  const product = {
    name: "Test2",
    description: "<p>bing<br /></p>",
    location_id: 2,
    shopping_location_id: 1,
    tare_weight: 0,
    qu_id_purchase: 4,
    qu_id_stock: 1,
    qu_factor_purchase_to_stock: 1,
  };
  const units = await grocy.getQuantityUnitIds();

  const search = await fetch(
    "https://www.paknsave.co.nz/CommonApi/SearchAutoComplete/AutoComplete",
    {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: '{"SearchTerm":"Chocolate"}',
      method: "POST",
    }
  );
  const res = await search.json();
  console.log(JSON.stringify(res));
}

main().then(
  () => exit(0),
  (err) => {
    console.error(err);
    exit(1);
  }
);
