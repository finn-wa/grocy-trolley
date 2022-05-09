import {
  FoodstuffsBaseProduct,
  FoodstuffsListProduct,
  ProductsSnapshot,
  SaleTypeString,
} from "../models";

export interface ListProductRef {
  productId: string;
  quantity: number;
  saleType: SaleTypeString;
}

export interface ListUpdate {
  listId: string;
  products?: ListProductRef[];
}

export interface List {
  listId: string;
  products: FoodstuffsListProduct[];
  name: string;
}

export function toListProductRef(product: FoodstuffsBaseProduct): ListProductRef {
  const { productId, quantity, sale_type: saleType } = product;
  return formatListProductRef({ productId, quantity, saleType });
}

export function formatListProductRef({
  productId,
  quantity,
  saleType,
}: ListProductRef): ListProductRef {
  return {
    productId: productId.replace(/(PNS|NW)/g, ""),
    quantity: quantity || 1,
    saleType: !saleType || saleType === "BOTH" ? "UNITS" : saleType,
  };
}

export function snapshotToListProductRefs(products: ProductsSnapshot) {
  return [...products.unavailableProducts, ...products.products].map((product) =>
    toListProductRef(product)
  );
}
