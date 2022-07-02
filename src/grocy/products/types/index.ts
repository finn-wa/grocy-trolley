import { GrocyProductGroup } from "@gt/grocy/grocy-config";
import { Product } from "./Product";

export interface ParentProduct {
  tags: string[];
  category: GrocyProductGroup;
  product: Product;
  children: Product[];
}
