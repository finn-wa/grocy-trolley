export const PAKNSAVE_URL = "https://www.paknsave.co.nz/CommonApi/";

export type SaleTypeString = "UNITS" | "WEIGHT" | "BOTH";

export interface SaleTypeDetail {
  minUnit: number;
  type: string;
  stepSize: number;
  unit: string;
}

export interface FoodstuffsProduct {
  badgeImageUrl: string;
  brand: string;
  catalogPrice: number;
  categoryName: string;
  hasBadge: boolean;
  imageUrl: string;
  liquor: boolean;
  name: string;
  originStatement: string;
  price: number;
  promoBadgeImageTitle: string;
  promotionCode: string;
  quantity: number;
  restricted: boolean;
  sale_type: SaleTypeString;
  saleTypes: SaleTypeDetail[];
  tobacco: boolean;
  uom: string;
  weightDisplayName: string;
}

export interface FoodstuffsStore {
  storeId: string;
  storeName: string;
  storeAddress: string;
  storeRegion: string;
}

export interface FoodstuffsCart {
  products: FoodstuffsProduct[];
  unavailableProducts: FoodstuffsProduct[];
  subtotal: number;
  promoCodeDiscount: number;
  saving: number;
  serviceFee: number;
  bagFee: number;
  store: FoodstuffsStore;
  orderNumber: number;
  allowSubstitutions: boolean;
  wasRepriced: boolean;
}
