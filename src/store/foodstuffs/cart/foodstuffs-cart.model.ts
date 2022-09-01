import {
  FoodstuffsBaseProduct,
  FoodstuffsCartProduct,
  FoodstuffsStore,
  ProductsSnapshot,
  SaleTypeString,
} from "../models";
import { Timeslot } from "../orders/foodstuffs-order.model";

export interface CartTimeslot extends Timeslot {
  expired: boolean;
  isValid: boolean;
  softCutOffDate: string;
  type: "COLLECT";
}

export interface FoodstuffsCart {
  products: FoodstuffsCartProduct[];
  unavailableProducts: FoodstuffsCartProduct[];
  subtotal: number;
  promoCodeDiscount: number;
  saving: number;
  serviceFee: number;
  bagFee: number;
  store: FoodstuffsStore;
  orderNumber: number;
  allowSubstitutions: boolean;
  wasRepriced: boolean;
  timeslot?: Timeslot;
}

export interface CartProductRef {
  productId: string;
  quantity: number;
  sale_type: SaleTypeString;
  restricted?: boolean;
}

export function toCartProductRef(product: FoodstuffsBaseProduct): CartProductRef {
  const saleType = product.sale_type === "BOTH" ? "UNITS" : product.sale_type;
  let productId = product.productId.replaceAll("-", "_");
  if (!productId.endsWith("PNS")) {
    productId += "PNS";
  }
  return {
    productId,
    quantity: product.quantity,
    restricted: product.restricted,
    sale_type: saleType,
  };
}

export function snapshotToCartProductRefs(products: ProductsSnapshot) {
  return [...products.unavailableProducts, ...products.products].map((product) =>
    toCartProductRef(product)
  );
}
