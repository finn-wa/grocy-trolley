import { updateTypes } from "@gt/grocy/types/grocy-types";

export interface RawProductBarcode {
  amount: string;
  barcode: string;
  id: string;
  last_price: string | null;
  note: string;
  product_id: string;
  qu_id: string;
  row_created_timestamp: string;
  shopping_location_id: string;
}

export type ProductBarcodes = RawProductBarcode[];

export interface ProductBarcode {
  amount: number | null;
  barcode: string;
  id: string;
  last_price: number | null;
  note: string | null;
  product_id: string;
  qu_id: string | null;
  row_created_timestamp: string;
  shopping_location_id: string | null;
}

export function parseProductBarcode(raw: RawProductBarcode): ProductBarcode {
  return updateTypes(raw, {
    booleans: [],
    numbers: ["amount", "last_price"],
    optionalIds: ["qu_id", "shopping_location_id"],
  });
}
