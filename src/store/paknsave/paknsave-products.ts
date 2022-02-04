export interface SaleType {
  minUnit: number;
  type: string;
  stepSize: number;
  unit: string;
}

export interface Product {
  quantity: number;
  sale_type: string;
  name: string;
  price: number;
  catalogPrice: number;
  hasBadge: boolean;
  badgeImageUrl: string;
  imageUrl: string;
  restricted: boolean;
  tobacco: boolean;
  liquor: boolean;
  saleTypes: SaleType[];
  weightDisplayName: string;
  brand: string;
  categoryName: string;
  promoBadgeImageTitle: string;
  promotionCode: string;
  uom: string;
  originStatement: string;
}

export interface ProductRef {
  productId: string;
  saleType: string;
  quantity: number;
}
