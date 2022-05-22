export interface Order {
  deliveryFee: number;
  fulfilmentDate: string;
  fulfilmentTime: string;
  isEditable: boolean;
  method: string;
  orderDate: string;
  orderId: number;
  prefix: string;
  status: string;
  total: number;
}
