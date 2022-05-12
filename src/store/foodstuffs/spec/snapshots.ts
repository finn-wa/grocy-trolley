import { FoodstuffsBaseProduct, FoodstuffsCartProduct, FoodstuffsListProduct } from "../models";

export function snapshot<T extends Record<string, any>>(
  obj: T,
  mutableProps: (keyof T)[]
): Record<string, any> {
  const mappedEntries = Object.entries(obj).map(([prop, value]) => {
    // typeof null is "object" which is shit
    if (mutableProps.includes(prop) && prop !== null) {
      return [prop, typeof value];
    }
    return [prop, value];
  });
  return Object.fromEntries(mappedEntries);
}

export function snapshotBaseProduct(product: FoodstuffsBaseProduct) {
  return snapshot(product, ["price"]);
}

export function snapshotCartProduct(product: FoodstuffsCartProduct) {
  return snapshot(product, [
    "price",
    "catalogPrice",
    "hasBadge",
    "promoBadgeImageTitle",
    "promotionCode",
  ]);
}
