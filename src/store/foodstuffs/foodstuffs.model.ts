import { FoodstuffsCategory } from ".";

export const PAKNSAVE_URL = "https://www.paknsave.co.nz/CommonApi/";

export type SaleTypeString = "UNITS" | "WEIGHT" | "BOTH";

export interface SaleTypeDetail {
  minUnit: number;
  type: string;
  stepSize: number;
  unit: string;
}

export interface FoodstuffsStore {
  storeId: string;
  storeName: string;
  storeAddress: string;
  storeRegion: string;
}

export interface FoodstuffsBaseProduct {
  name: string;
  /** Price in cents */
  price: number;
  productId: string;
  quantity: number;
  restricted: boolean;
  tobacco: boolean;
  sale_type: SaleTypeString;
}

/**
 * Product fields common to Cart and Order
 */
export interface ProductsSnapshot {
  products: FoodstuffsBaseProduct[];
  unavailableProducts: FoodstuffsBaseProduct[];
}

export interface FoodstuffsOrderProduct extends FoodstuffsBaseProduct {
  allowSubstitutions: boolean;
  categories: FoodstuffsCategory[];
}

export interface FoodstuffsLiveProduct extends FoodstuffsBaseProduct {
  liquor: boolean;
  imageUrl: string;
  saleTypes: SaleTypeDetail[];
}

export interface FoodstuffsListProduct extends FoodstuffsLiveProduct {
  category: FoodstuffsCategory;
  rangedInStore: boolean;
  rangedOnline: boolean;
  weight: string;
  weightUnitOfMeasure: string;
}

export interface FoodstuffsCartProduct extends FoodstuffsLiveProduct {
  badgeImageUrl: string;
  brand: string;
  catalogPrice: number;
  categoryName: FoodstuffsCategory;
  hasBadge: boolean;
  promoBadgeImageTitle: string;
  promotionCode: string;
  weightDisplayName: string;
}
