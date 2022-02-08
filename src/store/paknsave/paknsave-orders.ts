import { getForJson } from "@grocy-trolley/utils/fetch-utils";
import { PakNSaveAuthService } from ".";
import { PakNSaveRestService } from "./paknsave-rest-service";

export class PakNSaveOrdersService extends PakNSaveRestService {
  constructor(pnsAuthService: PakNSaveAuthService) {
    super(pnsAuthService);
  }

  async getOrders(): Promise<Order[]> {
    const response: OrdersResponse = await getForJson(
      this.buildUrl("Checkout/Orders"),
      this.authHeaders().acceptJson().build()
    );
    return response.orders;
  }

  async getOrderDetails(id: string): Promise<OrderDetails> {
    return getForJson(
      this.buildUrl("Checkout/OrderDetails", { id }),
      this.authHeaders().acceptJson().build()
    );
  }
}

export interface Timeslot {
  slot: string;
  cutOffDate: Date;
  date: string;
}

export interface Order {
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

export interface OrdersResponse {
  orders: Order[];
}

export interface OrderSummary {
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

export interface OrderedProduct {
  productId: string;
  quantity: number;
  sale_type: string;
  price: number;
  name: string;
  categories: string[];
  restricted: boolean;
  allowSubstitutions: boolean;
  tobacco: boolean;
}

export interface OrderDetails {
  summary: OrderSummary;
  products: OrderedProduct[];
  unavailableProducts: OrderedProduct[];
  entitlements: {
    promoCode: unknown[];
    voucher: unknown[];
    continuity: unknown[];
  };
}
