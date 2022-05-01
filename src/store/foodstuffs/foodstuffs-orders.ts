import { Logger } from "@gt/utils/logger";
import { FoodstuffsOrderProduct, FoodstuffsUserAgent } from ".";
import { FoodstuffsRestService } from "./rest-service/foodstuffs-rest-service";

export class FoodstuffsOrderService extends FoodstuffsRestService {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(userAgent: FoodstuffsUserAgent) {
    super(userAgent);
  }

  async getOrders(): Promise<FoodstuffsOrder[]> {
    const headersBuilder = await this.authHeaders();
    const response: FoodstuffsOrdersResponse = await this.getForJson(
      this.buildUrl("Checkout/Orders"),
      headersBuilder.acceptJson().build()
    );
    return response.orders;
  }

  async getOrderDetails(id: string): Promise<FoodstuffsOrderDetails> {
    const headersBuilder = await this.authHeaders();
    return this.getForJson(
      this.buildUrl("Checkout/OrderDetails", { id }),
      headersBuilder.acceptJson().build()
    );
  }
}

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
