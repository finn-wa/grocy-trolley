import { ajv, getRequiredSchema } from "@gt/jtd/ajv";
import { JTDSchemaType } from "ajv/dist/jtd";
import { Orders } from ".";

/**
 * This will cause a TypeScript compiler error if the Orders type defined in
 * index.ts is modified in a way that makes it incompatible with the schema.
 */
export const schema: JTDSchemaType<Orders> = {
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
          deliveryFee: { type: "uint16" },
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
        additionalProperties: true,
      },
    },
    totalItems: { type: "uint16" },
  },
  additionalProperties: true,
};

/**
 * The key used to index the Orders schema with ajv
 */
export const key = "src/store/countdown/orders/Orders";

/**
 * Calls {@link ajv.getSchema} with the Orders schema {@link key}. The schema is
 * compiled on the first call to  {@link ajv.getSchema}.
 *
 * @returns A validate() function for Orders
 */
export const getOrdersSchema = () => getRequiredSchema<Orders>(key);

// Register schema with ajv instance
ajv.addSchema(schema, key);
