import { ajv, getRequiredSchema } from "@gt/jtd/ajv";
import {
  FoodstuffsCartProduct,
  FOODSTUFFS_CATEGORIES,
  SaleTypeString,
} from "@gt/store/foodstuffs/models";
import { JTDSchemaType } from "ajv/dist/jtd";
import { FoodstuffsCart } from "../../foodstuffs-cart.model";

const saleTypes: SaleTypeString[] = ["UNITS", "WEIGHT", "BOTH"];
const categories = [...FOODSTUFFS_CATEGORIES];

const productSchema: JTDSchemaType<FoodstuffsCartProduct> = {
  properties: {
    badgeImageUrl: { type: "string" },
    catalogPrice: { type: "uint16" },
    categoryName: { enum: categories },
    hasBadge: { type: "boolean" },
    imageUrl: { type: "string" },
    liquor: { type: "boolean" },
    name: { type: "string" },
    price: { type: "uint16" },
    productId: { type: "string" },
    promoBadgeImageTitle: { type: "string" },
    promotionCode: { type: "string" },
    quantity: { type: "uint16" },
    restricted: { type: "boolean" },
    saleTypes: {
      elements: {
        properties: {
          minUnit: { type: "uint16" },
          stepSize: { type: "uint16" },
          type: { enum: saleTypes },
          unit: { type: "string" },
        },
      },
    },
    sale_type: { enum: saleTypes },
    tobacco: { type: "boolean" },
    weightDisplayName: { type: "string" },
  },
  optionalProperties: {
    brand: { type: "string" },
    originStatement: { type: "string" },
    uom: { type: "string" },
  },
};

/**
 * This will cause a TypeScript compiler error if the FoodstuffsCart type defined in
 * index.ts is modified in a way that makes it incompatible with the schema.
 */
export const schema: JTDSchemaType<FoodstuffsCart> = {
  properties: {
    bagFee: { type: "uint16" },
    products: {
      elements: productSchema,
    },
    promoCodeDiscount: { type: "uint16" },
    saving: { type: "uint16" },
    serviceFee: { type: "uint16" },
    subtotal: { type: "uint16" },
    unavailableProducts: { elements: productSchema },
    wasRepriced: { type: "boolean" },
  },
  optionalProperties: {
    orderNumber: { type: "uint16" },
    allowSubstitutions: { type: "boolean" },
    timeslot: {
      properties: {
        cutOffDate: { type: "timestamp" },
        date: { type: "string" },
        expired: { type: "boolean" },
        isValid: { type: "boolean" },
        slot: { type: "string" },
        softCutOffDate: { type: "timestamp" },
        type: { enum: ["COLLECT"] },
      },
    },
    store: {
      properties: {
        storeAddress: { type: "string" },
        storeId: { type: "string" },
        storeName: { type: "string" },
        storeRegion: { type: "string" },
      },
    },
  },
};

/**
 * The key used to index the FoodstuffsCart schema with ajv
 */
export const key = "src/store/foodstuffs/cart/FoodstuffsCart";

/**
 * Calls {@link ajv.getSchema} with the FoodstuffsCart schema {@link key}. The schema is
 * compiled on the first call to  {@link ajv.getSchema}.
 *
 * @returns A validate() function for FoodstuffsCart
 */
export const getCartSchema = () => getRequiredSchema<FoodstuffsCart>(key);

// Register schema with ajv
ajv.addSchema(schema, key);
