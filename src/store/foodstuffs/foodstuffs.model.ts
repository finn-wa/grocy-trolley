import { FoodstuffsCategory } from ".";

export const PAKNSAVE_URL = "https://www.paknsave.co.nz/CommonApi/";

export type SaleTypeString = "UNITS" | "WEIGHT" | "BOTH";

export interface SaleTypeDetail {
  minUnit: number;
  type: SaleTypeString;
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
  /** Empty string when sale type is UNITS */
  weight: string;
  /** Empty string when sale type is UNITS */
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

const foodstuffsEndpoints = {
  BaseURL: "/shop",
  BaseServiceURL: "https://www.paknsave.co.nz/CommonApi/",
  CommonFeature: "CommonFeature/",
  NavigationEndPoint:
    "Navigation/MegaMenu" + "?v=25354" + "&storeId=" + "e1925ea7-01bc-4358-ae7c-c6502da5ab12",
  Breadcrumbs:
    "Navigation/Breadcrumbs/f07feb31e9014fc9abeb6b1ae5b50d01" +
    "?v=25354" +
    "&storeId=" +
    "e1925ea7-01bc-4358-ae7c-c6502da5ab12",
  AutocompleteSearchServiceEndpoint: "SearchAutoComplete/AutoComplete",
  AuthenticationEndPoint: "Account/Login",
  LogoutEndPoint: "Account/UserLogout",
  GetUserProfile: "Account/GetUserProfile",
  ChangeStoreEndpoint: "Store/ChangeStore?storeId=",
  StoresDataEndpoint: "Store/GetStoreList",
  StoresClickAndCollectSlotsEndpoint: "Delivery/GetClickCollectTimeSlot",
  StoresClickAndCollectSetSlotsEndpoint: "Delivery/ReserveCnCTimeSlot",
  CartEndpoint: "Cart/Index",
  SimpleCartUpdateEndpoint: "Cart/SimpleIndex",
  EmptyTrolleyEndPoint: "Cart/Clear",
  AddPromoCodeEndpoint: "Cart/AddPromoCode",
  RemovePromoCodeEndpoint: "Cart/RemovePromoCode",
  UpdatePromoCodeEndpoint: "Cart/UpdatePromoCode",
  AddressSearchEndpoint: "Address/Search",
  AddressDetailsEndpoint: "Address/Details",
  AddressGeocodeEndpoint: "Address/Geocode",
  AddressSaveEndpoint: "AddressBook/Save",
  AddressRenameEndpoint: "AddressBook/Rename",
  AddressDeleteEndpoint: "AddressBook/Delete",
  AddressBookListEndpoint: "AddressBook/List",
  AddressBookDetailsEndpoint: "AddressBook/Details",
  DeliverySlotsEndpoint: "Delivery/GetDeliveryTimeSlots",
  GetStoreCollectionPointSlotsEndpoint: "Delivery/GetStoreCollectionPointSlots",
  GetStoreCollectionPointsEndpoint: "Delivery/GetStoreCollectionPoints",
  StoresReserveTimeslot: "Delivery/ReserveTimeslot",
  ServiceFeeEnpoint:
    "Delivery/GetFees" + "?v=25354" + "&storeId=" + "e1925ea7-01bc-4358-ae7c-c6502da5ab12",
  ServiceFeeEndpoint:
    "Delivery/GetFees" + "?v=25354" + "&storeId=" + "e1925ea7-01bc-4358-ae7c-c6502da5ab12",
  GetStoreServiceFeesEndpoint: "Store/GetStoreServiceFees",
  ForgotPassword: "Account/PasswordReset",
  ChangePasswordEndpoint: "Account/ChangePassword",
  SearchByEmailEndpoint: "Account/SearchByEmail",
  SearchUserEndpoint: "Account/SearchUser",
  ValidateUser: "Account/ValidateUser",
  UserSecurityQuestionsEndpoint: "Account/GetUserSecurityQuestions",
  CompleteRegistrationWithClubCardEndpoint: "Account/UserCompleteRegistration",
  CompleteShortRegistrationEndpoint: "Account/UserCompleteShortRegistration",
  UserRegistrationWithoutClubCardEndpoint: "Account/UserRegistration",
  UpdateUserProfile: "Account/UpdateUserProfile",
  GetListsEndpoint: "ShoppingLists/GetLists",
  GetListEndpoint: "ShoppingLists/GetList",
  AddCartToListEndpoint: "ShoppingLists/AddCartToList",
  CreateListEndpoint: "ShoppingLists/CreateList",
  UpdateListEndpoint: "ShoppingLists/UpdateList",
  DeleteListEndpoint: "ShoppingLists/DeleteList",
  RenameListEndpoint: "ShoppingLists/RenameList",
  GetCardStatusEndPoint: "Checkout/GetCardStatus",
  GetFavouriteListEndPoint: "ShoppingLists/GetFavouriteList",
  TrackDeliveryMethod: "AnalyticsDataPush/Method",
  TrackTimeSlot: "AnalyticsDataPush/TimeSlot",
  TrackTimeSlotDate: "AnalyticsDataPush/DateFil",
  ClearFulfilmentObjOnLogout: "AnalyticsDataPush/ClearFulfilmentObjOnLogout",
  ServiceBagEndpoint: "Delivery/GetBagFees" + "?v=25354",
  EditOrderEndpoint: "Checkout/EditOrder",
  CancelEditOrderEndpoint: "Checkout/CancelEditOrder",
  CancelPlacedOrderEndpoint: "Checkout/CancelPlacedOrder",
  GetOrdersEndpoint: "Checkout/Orders",
  GetOrderDetailsEndpoint: "Checkout/OrderDetails",
  GetShopFromOrderDetailsEndpoint: "Checkout/ShopFromOrderDetails",
  SubmitOrder: "Checkout/SubmitOrder",
  PayOrder: "Checkout/PayOrder",
  GetCardsEndPoint: "Checkout/Cards",
  GetCardEndPoint: "Checkout/GetCard",
  SetNewPasswordEndPoint: "Account/SetNewPassword",
  UpdateGeolocationEndpoint: "/GeoApi/GeolocationUpdate",
  Environment: "prod",
  ShoppingCartURL: "/shop/shopping-cart",
  PreviousProductPurchaseEndpoint: "Checkout/GetPreviousProductPurchases",
  RelatedProductsEndpoint: "Product/RelatedProducts",
  PromoGroupEndpoint: "PromoGroup/GetPromoGroup",
  CuratedCarouselEndpoint: "Product/GetCuratedCarousel",
};
