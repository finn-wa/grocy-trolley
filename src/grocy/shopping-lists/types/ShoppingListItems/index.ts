// Code generated by jtd-codegen for TypeScript v0.2.1

interface BaseShoppingListItem {
  done: string;
  id: string;
  note: string | null;
  product_id: string;
  qu_id: string;
  row_created_timestamp: string;
  shopping_list_id: string;
}

export interface RawShoppingListItem extends BaseShoppingListItem {
  amount: string | number;
}

export type RawShoppingListItems = RawShoppingListItem[];

export interface ShoppingListItem extends BaseShoppingListItem {
  amount: number;
}
