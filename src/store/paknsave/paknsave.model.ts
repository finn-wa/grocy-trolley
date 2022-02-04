// should make open api definition

import { Product } from "./paknsave-products";

// possibly could be dynamic? via requests
export const PAKNSAVE_URL = "https://www.paknsave.co.nz/CommonApi";

export interface Store {
  storeId: string;
  storeName: string;
  storeAddress: string;
  storeRegion: string;
}

export interface Cart {
  products: Product[];
  unavailableProducts: Product[];
  subtotal: number;
  promoCodeDiscount: number;
  saving: number;
  serviceFee: number;
  bagFee: number;
  store: Store;
  orderNumber: number;
  allowSubstitutions: boolean;
  wasRepriced: boolean;
}
