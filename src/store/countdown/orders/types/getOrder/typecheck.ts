/**
 * This file is only for confirming that the TypeScript types and the schema
 * stay in sync.
 */

import { JTDDataType } from "ajv/dist/core";
import { Order } from ".";

type JTD_Order = JTDDataType<{
  properties: {
    deliveryFee: { type: "uint8" };
    fulfilmentDate: { type: "string" };
    fulfilmentTime: { type: "string" };
    isEditable: { type: "boolean" };
    method: { type: "string" };
    orderDate: { type: "string" };
    orderId: { type: "uint32" };
    prefix: { type: "string" };
    status: { type: "string" };
    total: { type: "float64" };
  };
}>;
/* eslint-disable */
type DoesExtend<X, Y extends X> = Y;
type _CustomExtendsJTD = DoesExtend<JTD_Order, Order>;
type _JTDExtendsCustom = DoesExtend<Order, JTD_Order>;
/* eslint-enable */
