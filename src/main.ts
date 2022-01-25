import { exit } from "process";
import { GrocyStore } from "./product/store/grocy";
import { EnvParser } from "./resources/env";

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
  const res = await grocy.createProduct(product);
  console.log(res);
  const products = await grocy.getProducts();
  console.log(products);
}

main().then(
  () => exit(0),
  (err) => {
    console.error(err);
    exit(1);
  }
);
