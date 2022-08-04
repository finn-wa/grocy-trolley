export interface GrocerProductPrice {
  multibuy_limit: number | null;
  multibuy_price: number | null;
  multibuy_quantity: number | null;
  original_price: number | null;
  sale_price: number | null;
  store_id: number;
  store_name: string;
  vendor_code: string;
  club_multibuy_limit: number | null;
  club_multibuy_price: number | null;
  club_multibuy_quantity: number | null;
  club_price: number | null;
}

export interface GrocerProduct {
  brand: string;
  id: number;
  name: string;
  prices: GrocerProductPrice[];
  size: string;
  unit: string;
}
