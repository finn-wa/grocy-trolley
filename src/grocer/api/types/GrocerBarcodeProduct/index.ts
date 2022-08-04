import { GrocerProduct } from "../GrocerProduct";

export interface GrocerBarcodeProduct extends GrocerProduct {
  barcode: string;
}
