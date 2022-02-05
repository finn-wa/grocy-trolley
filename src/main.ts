import { exit } from "process";
import { PakNSaveAuthService } from "@grocy-trolley/store/paknsave";
import { EnvParser } from "./env";
import { GrocyStore } from "./grocy/grocy";

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
  active: "1";
  calories: "0";
  cumulate_min_stock_amount_of_sub_products: "0";
  default_best_before_days_after_freezing: "0";
  default_best_before_days_after_thawing: "0";
  due_type: "1";
  hide_on_stock_overview: "0";
  parent_product_id: "2";
  quick_consume_amount: "1";
  should_not_be_frozen: "0";
}

async function main() {
  const env = new EnvParser("env.json").env;
  const grocy = new GrocyStore(env.GROCY_URL, env.GROCY_API_KEY);
  const pakNSaveAuthService = new PakNSaveAuthService(env.PAKNSAVE_EMAIL, env.PAKNSAVE_PASSWORD);
  await pakNSaveAuthService.login();
  console.log(pakNSaveAuthService.cookie?.replace(/;/g, ";\n"));
}

main().then(
  () => exit(0),
  (err) => {
    console.error(err);
    exit(1);
  }
);
