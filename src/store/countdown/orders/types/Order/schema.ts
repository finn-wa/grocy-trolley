import { ajv, getRequiredSchema } from "@gt/jtd/ajv";
import { JTDSchemaType } from "ajv/dist/jtd";
import { Order } from ".";

/**
 * This will cause a TypeScript compiler error if the Order type defined in
 * index.ts is modified in a way that makes it incompatible with the schema.
 */
export const schema: JTDSchemaType<Order> = {
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
};

/**
 * The key used to index the Order schema with ajv
 */
export const key = "src/store/countdown/orders/Order";

/**
 * Calls {@link ajv.getSchema} with the Order schema key. The schema is compiled
 * on the first call to  {@link ajv.getSchema}.
 *
 * @returns A validate() function
 */
export const getOrderSchema = () => getRequiredSchema<Order>(key);

// Register schema with ajv instance
ajv.addSchema(schema, key);
