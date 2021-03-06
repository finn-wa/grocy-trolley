// Code generated by jtd-codegen for TypeScript v0.2.1

export interface ShoppingLocationUserfields {
  brand: string;
  storeId: string;
}

export interface ShoppingLocation {
  description: string;
  id: string;
  name: string;
  row_created_timestamp: string;
  userfields: ShoppingLocationUserfields;
}

export type ShoppingLocations = ShoppingLocation[];
