import { getForJson } from "@grocy-trolley/utils/fetch-utils";
import { FoodstuffsAuthService, SaleTypeString } from ".";
import { FoodstuffsRestService } from "./foodstuffs-rest-service";

export class FoodstuffsOrderService extends FoodstuffsRestService {
  constructor(authService: FoodstuffsAuthService) {
    super(authService);
  }

  async getOrders(): Promise<FoodstuffsOrder[]> {
    const response: FoodstuffsOrdersResponse = await getForJson(
      this.buildUrl("Checkout/Orders"),
      this.authHeaders().acceptJson().build()
    );
    return response.orders;
  }

  async getOrderDetails(id: string): Promise<FoodstuffsOrderDetails> {
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

export interface FoodstuffsOrderedProduct {
  productId: string;
  quantity: number;
  sale_type: SaleTypeString;
  price: number;
  name: string;
  categories: string[];
  restricted: boolean;
  allowSubstitutions: boolean;
  tobacco: boolean;
}

export interface FoodstuffsOrderDetails {
  summary: FoodstuffsOrderSummary;
  products: FoodstuffsOrderedProduct[];
  unavailableProducts: FoodstuffsOrderedProduct[];
  entitlements: {
    promoCode: unknown[];
    voucher: unknown[];
    continuity: unknown[];
  };
}
