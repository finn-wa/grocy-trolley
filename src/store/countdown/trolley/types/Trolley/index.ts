// Code generated by jtd-codegen for TypeScript v0.2.1

import { Unknown } from "@gt/jtd/infer";

export interface TrolleyContextAdvancedSettingsResponse {
  allowBannerRotation: boolean;
  itemLevelSubstitution: boolean;
  showHaveYouForgotten: boolean;
}

export interface TrolleyContextBasketTotals {
  bagFees: string;
  deliveryFees: string;
  eligibilityForDeliverySubscriptionDiscount: string;
  savings: string | null;
  subtotal: string;
  totalIncludingDeliveryFees: string;
  totalItems: number;
}

export interface TrolleyContextFulfilmentExpressFulfilment {
  isExpressSlot: boolean;
  isLastExpressHourWindow: boolean;
}

export interface TrolleyContextFulfilment {
  address: string;
  areaId: number;
  expressFulfilment: TrolleyContextFulfilmentExpressFulfilment;
  fulfilmentStoreId: number;
  isAddressInDeliveryZone: boolean;
  isDefaultDeliveryAddress: boolean;
  isSlotToday: boolean;
  method: string;
  perishableCode: string;
  cutOffTime?: unknown;
  endTime?: unknown;
  locker?: unknown;
  selectedDate?: unknown;
  selectedDateWithTZInfo?: unknown;
  startTime?: unknown;
  suburbId: number;
}

export interface TrolleyContextShopperOneCardBalance {
  isOneCardInError: boolean;
  oneCardCurrency: string;
  oneCardNumber: string;
  onecardPointsBalance: number | null;
  redeemableRewardVouchers: number;
  continuitySpend?: unknown;
}

export interface TrolleyContextShopper {
  firstName: string;
  hasActiveDeliverySubscription: boolean;
  hasOnecard: boolean;
  isChangingOrder: boolean;
  isLoggedIn: boolean;
  isPriorityShopper: boolean;
  isShopper: boolean;
  isSupplyLimitOverrideShopper: boolean;
  oneCardBalance: TrolleyContextShopperOneCardBalance;
  orderCount: string;
  sessionGroups: number[];
  shopperIdHash: string;
  shopperScvId: string;
  changingOrderId?: unknown;
}

export interface TrolleyContext {
  advancedSettingsResponse: TrolleyContextAdvancedSettingsResponse;
  basketTotals: TrolleyContextBasketTotals;
  enabledFeatures: string[];
  fulfilment: TrolleyContextFulfilment;
  shopper: TrolleyContextShopper;
  shoppingListItems: string[];
}

export interface TrolleyItemProductImages {
  big: string;
  small: string;
}

export interface TrolleyItemProductPrice {
  averagePricePerSingleUnit: number | null;
  canShowOriginalPrice: boolean;
  discount: string | null;
  hasBonusPoints: boolean;
  isClubPrice: boolean;
  isNew: boolean;
  isSpecial: boolean;
  isTargetedOffer: boolean;
  originalPrice: number;
  salePrice: number;
  savePrice: number;
  total: string | null;
  purchasingUnitPrice?: unknown;
}

export interface TrolleyItemProductProductTagMultiBuy {
  link: string;
  quantity: number;
  value: number;
}

export interface TrolleyItemProductProductTag {
  multiBuy: TrolleyItemProductProductTagMultiBuy | null;
  tagType: string;
  additionalTag?: unknown;
  bonusPoints?: unknown;
  targetedOffer?: unknown;
}

export interface TrolleyItemProductQuantity {
  increment: number;
  max: number;
  min: number;
  purchasingQuantityString: string;
  quantityInOrder: number;
  value: number;
}

export interface TrolleyItemProductSize {
  cupMeasure: string | null;
  cupPrice: number;
  packageType: string | null;
  volumeSize: string | null;
}

export interface TrolleyItemProduct {
  averageWeightPerUnit: number | null;
  hasShopperNotes: boolean;
  images: TrolleyItemProductImages;
  name: string;
  price: TrolleyItemProductPrice;
  priceUnitLabel: string;
  productTag: TrolleyItemProductProductTag | null;
  quantity: TrolleyItemProductQuantity;
  selectedPurchasingUnit: string | null;
  size: TrolleyItemProductSize;
  sku: string;
  slug: string;
  subsAllowed: boolean;
  supportsBothEachAndKgPricing: boolean;
  type: string;
  unit: string;
  adId?: unknown;
  barcode?: unknown;
  brand?: unknown;
  dasFacetsUrl?: string;
  eachUnitQuantity?: unknown;
  shopperNotes?: string;
  variety?: unknown;
}

export interface TrolleyItem {
  categoryDescription: string;
  categoryType: string;
  products: TrolleyItemProduct[];
}

export interface Trolley {
  context: TrolleyContext;
  isSuccessful: boolean;
  itemCount: number;
  items: TrolleyItem[];
  messages: Unknown[];
  rootUrl: string;
}
