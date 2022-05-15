import { compileSchema } from "@gt/jtd/ajv";
import { JTDSchemaType } from "ajv/dist/core";
import { Orders } from ".";

/**
 * This will cause a TypeScript compiler error if the Order type defined in
 * index.ts is modified in a way that makes it incompatible with the schema.
 */
const schema: JTDSchemaType<Orders> = {
  properties: {
    filterList: {
      elements: {
        properties: {
          selected: { type: "boolean" },
          text: { type: "string" },
          value: { type: "string" },
        },
      },
    },
    items: {
      elements: {
        properties: {
          deliveryFee: { type: "uint8" },
          fulfilmentDate: { type: "string" },
          fulfilmentTime: { type: "string" },
          isEditable: { type: "boolean" },
          method: { type: "string" },
          orderDate: { type: "string" },
          orderId: { type: "uint32" },
          prefix: { type: "string" },
          status: { type: "string" },
          total: { type: "float64" },
        },
      },
    },
    totalItems: { type: "uint8" },
  },
};
export default schema;

export const OrdersSchema = compileSchema<Orders>(schema);
