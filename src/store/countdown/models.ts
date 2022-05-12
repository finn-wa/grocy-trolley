export const COUNTDOWN_URL = "https://www.countdown.co.nz";

export interface Link {
  id: number;
  label: string;
  url: string;
  isNew?: boolean;
}

export interface DynamicLink extends Link {
  isEnabled: boolean;
}

export interface NavigationItem {
  label: string;
  items: Link[];
}

export interface MainNav {
  label: string;
  labels: Record<string, string>;
  url: string;
  isNew: boolean;
  navigationItems: NavigationItem[];
}

export interface SpecialsBanner {
  image: string;
  link: string;
  linkTarget: string;
  altText: string;
}

export interface FulfilmentTimeouts {
  reservationTimeout: number;
  closingSoon: number;
  closingNow: number;
}

export interface FooterLinks {
  newtoonlineshopping: DynamicLink;
}

export interface ProductSearchSettings {
  maximumPagesToAutoLoad: number;
  thresholdToLoadMoreOnScroll: number;
}

export interface ExpressFulfilmentSettings {
  expressPickUpFee: number;
  expressDeliveryFee: number;
  maxItemQuantityForExpressOrders: number;
  expressFulfilmentStartTime: string;
  expressFulfilmentEndTime: string;
  expressDeliveryFulfilmentStartTime: string;
  expressDeliveryFulfilmentEndTime: string;
  minimumTimeForExpressPickupOrdersToBeReady: number;
  minimumTimeForExpressDeliveryOrdersToBeReady: number;
}

export interface DeliverySubscriptionSettings {
  deliverySubscriptionMinimumOrderValue: number;
}

export interface ExpressFulfilmentMessages {
  closingSoon: string;
  closingNow: string;
  closed: string;
  closedChooseAnotherSlot: string;
}

export interface DeliveryFee {
  orderValue: number;
  orderValueMax?: number;
  baseFee: number;
  additionalPercentageFee: number;
  isBagFee: boolean;
  isFreeDeliveryWithPass: boolean;
  isFreeDeliveryWithByoBag: boolean;
  isFreeDelivery: boolean;
}

export interface OneCardBalance {
  isOneCardInError: boolean;
  onecardPointsBalance: number;
  continuitySpend?: unknown;
  redeemableRewardVouchers: number;
  oneCardNumber: string;
  oneCardCurrency: string;
}

export interface Shopper {
  firstName: string;
  isShopper: boolean;
  isLoggedIn: boolean;
  hasOnecard: boolean;
  oneCardBalance: OneCardBalance;
  shopperIdHash: string;
  shopperScvId: string;
  sessionGroups: number[];
  orderCount: string;
  isSupplyLimitOverrideShopper: boolean;
  isPriorityShopper: boolean;
  isChangingOrder: boolean;
  changingOrderId?: unknown;
  hasActiveDeliverySubscription: boolean;
}

export interface ExpressFulfilment {
  isExpressSlot: boolean;
  isLastExpressHourWindow: boolean;
}

export interface Fulfilment {
  address: string;
  selectedDate?: unknown;
  selectedDateWithTZInfo?: unknown;
  startTime?: unknown;
  endTime?: unknown;
  method: string;
  cutOffTime?: unknown;
  isSlotToday: boolean;
  isAddressInDeliveryZone: boolean;
  isDefaultDeliveryAddress: boolean;
  areaId: number;
  fulfilmentStoreId: number;
  perishableCode: string;
  locker?: unknown;
  expressFulfilment: ExpressFulfilment;
}

export interface BasketTotals {
  subtotal: string;
  savings?: unknown;
  totalItems: number;
  deliveryFees: string;
  bagFees: string;
  totalIncludingDeliveryFees: string;
  eligibilityForDeliverySubscriptionDiscount: string;
}

export interface AdvancedSettingsResponse {
  showHaveYouForgotten: boolean;
  itemLevelSubstitution: boolean;
  allowBannerRotation: boolean;
}

export interface Context {
  shopper: Shopper;
  fulfilment: Fulfilment;
  enabledFeatures: string[];
  shoppingListItems: string[];
  basketTotals: BasketTotals;
  advancedSettingsResponse: AdvancedSettingsResponse;
}

export interface Shell {
  browse: Link[];
  specials: Link[];
  dynamicHeaderLink: DynamicLink;
  mainNavs: MainNav[];
  browseBanners: unknown[];
  specialsBanners: SpecialsBanner[];
  recipesBanners: unknown[];
  fulfilmentMessages: Record<string, string>;
  fulfilmentTimeouts: FulfilmentTimeouts;
  traderVersion: string;
  footerLinks: FooterLinks;
  disabledMessageTitleNames: string[];
  productSearchSettings: ProductSearchSettings;
  expressFulfilmentSettings: ExpressFulfilmentSettings;
  deliverySubscriptionMessages: Record<string, string>;
  deliverySubscriptionSettings: DeliverySubscriptionSettings;
  expressFulfilmentMessages: ExpressFulfilmentMessages;
  deliveryFees: DeliveryFee[];
  isSuccessful: boolean;
  rootUrl: string;
  context: Context;
  messages?: unknown;
}
