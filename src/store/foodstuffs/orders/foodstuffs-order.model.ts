import { FoodstuffsOrderProduct } from "../models";

export interface Timeslot {
  slot: string;
  cutOffDate: Date;
  date: string;
}

export interface FoodstuffsOrder {
  orderNumber: string;
  fullfilmentMethod: string;
  status: string;
  totalCostInCents: number;
  gst: number;
  serviceFee: number;
  promoCodeDiscount: number;
  bagFee: number;
  timeslot: Timeslot;
  total: number;
  date: string;
}

export interface FoodstuffsOrdersResponse {
  orders: FoodstuffsOrder[];
}

export interface FoodstuffsOrderSummary {
  orderNumber: string;
  fullfilmentMethod: string;
  clickAndCollectAddress: string;
  timeslot: Timeslot;
  status: string;
  totalNumberOfItems: number;
  totalCostInCents: number;
  storeName: string;
  gst: number;
  serviceFee: number;
  bagFee: number;
  promoCodeDiscount: number;
  statusCode: string;
  invoiceAmountInCents: number;
  invoiceNumber: string;
}

export interface FoodstuffsOrderDetails {
  summary: FoodstuffsOrderSummary;
  products: FoodstuffsOrderProduct[];
  unavailableProducts: FoodstuffsOrderProduct[];
  entitlements: {
    promoCode: unknown[];
    voucher: unknown[];
    continuity: unknown[];
  };
}

export function getOrderTitle(order: FoodstuffsOrderDetails) {
  const { orderNumber, timeslot, storeName } = order.summary;
  return `Order #${orderNumber} | ${timeslot.date} | ${storeName}`;
}
