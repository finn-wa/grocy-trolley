// Code generated by jtd-codegen for TypeScript v0.2.1

export interface FoodstuffsCartProductSaleType {
  minUnit: number;
  stepSize: number;
  type: string;
  unit: string;
}

export interface FoodstuffsCartProduct {
  badgeImageUrl: string;
  catalogPrice: number;
  categoryName: string;
  hasBadge: boolean;
  imageUrl: string;
  liquor: boolean;
  name: string;
  price: number;
  productId: string;
  promoBadgeImageTitle: string;
  promotionCode: string;
  quantity: number;
  restricted: boolean;
  saleTypes: FoodstuffsCartProductSaleType[];
  sale_type: string;
  tobacco: boolean;
  weightDisplayName: string;
  brand?: string;
  originStatement?: string;
  uom?: string;
}

export interface FoodstuffsCartStore {
  storeAddress: string;
  storeId: string;
  storeName: string;
  storeRegion: string;
}

export interface FoodstuffsCartTimeslot {
  cutOffDate: string;
  date: string;
  expired: boolean;
  isValid: boolean;
  slot: string;
  softCutOffDate: string;
  type: string;
}

export interface FoodstuffsCart {
  allowSubstitutions?: boolean;
  bagFee: number;
  orderNumber: number;
  products: FoodstuffsCartProduct[];
  promoCodeDiscount: number;
  saving: number;
  serviceFee: number;
  store: FoodstuffsCartStore;
  subtotal: number;
  unavailableProducts: FoodstuffsCartProduct[];
  wasRepriced: boolean;
  timeslot?: FoodstuffsCartTimeslot;
}
