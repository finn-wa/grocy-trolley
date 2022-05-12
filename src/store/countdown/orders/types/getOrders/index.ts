import { Order } from "../getOrder";

export interface OrdersFilterList {
  selected: boolean;
  text: string;
  value: string;
}

export interface Orders {
  filterList: OrdersFilterList[];
  items: Order[];
  totalItems: number;
}
