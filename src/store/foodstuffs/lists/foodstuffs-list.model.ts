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
  products?: FoodstuffsListProduct[];
  Name?: string;
}

export interface List {
  listId: string;
  products: FoodstuffsListProduct[];
  name: string;
}

export function toListProductRef(product: FoodstuffsBaseProduct): ListProductRef {
  const saleType = product.sale_type === "BOTH" ? "UNITS" : product.sale_type;
  return {
    productId: product.productId,
    quantity: product.quantity,
    saleType,
  };
}

export function snapshotToListProductRefs(products: ProductsSnapshot) {
  return [...products.unavailableProducts, ...products.products].map((product) =>
    toListProductRef(product)
  );
}
