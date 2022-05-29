import { ajv, getRequiredSchema } from "@gt/jtd/ajv";
import {
  FoodstuffsCartProduct,
  FOODSTUFFS_CATEGORIES,
  SaleTypeString,
} from "@gt/store/foodstuffs/models";
import { JTDSchemaType } from "ajv/dist/jtd";
import { Cart } from ".";
import { FoodstuffsCart } from "../../foodstuffs-cart.model";

const saleTypes: SaleTypeString[] = ["UNITS", "WEIGHT", "BOTH"];
const categories = [...FOODSTUFFS_CATEGORIES];

const productSchema: JTDSchemaType<FoodstuffsCartProduct> = {
  properties: {
    badgeImageUrl: { type: "string" },
    catalogPrice: { type: "uint8" },
    categoryName: { enum: categories },
    hasBadge: { type: "boolean" },
    imageUrl: { type: "string" },
    liquor: { type: "boolean" },
    name: { type: "string" },
    price: { type: "uint16" },
    productId: { type: "string" },
    promoBadgeImageTitle: { type: "string" },
    promotionCode: { type: "string" },
    quantity: { type: "uint8" },
    restricted: { type: "boolean" },
    saleTypes: {
      elements: {
        properties: {
          minUnit: { type: "uint8" },
          stepSize: { type: "uint8" },
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
 * This will cause a TypeScript compiler error if the Cart type defined in
 * index.ts is modified in a way that makes it incompatible with the schema.
 */
export const schema: JTDSchemaType<FoodstuffsCart> = {
  properties: {
    allowSubstitutions: { type: "boolean" },
    bagFee: { type: "uint8" },
    orderNumber: { type: "uint8" },
    products: {
      elements: productSchema,
    },
    promoCodeDiscount: { type: "uint8" },
    saving: { type: "uint8" },
    serviceFee: { type: "uint8" },
    store: {
      properties: {
        storeAddress: { type: "string" },
        storeId: { type: "string" },
        storeName: { type: "string" },
        storeRegion: { type: "string" },
      },
    },
    subtotal: { type: "uint16" },
    unavailableProducts: { elements: productSchema },
    wasRepriced: { type: "boolean" },
  },
};

/**
 * The key used to index the Cart schema with ajv
 */
export const key = "FoodstuffsCart";

/**
 * Calls {@link ajv.getSchema} with the Cart schema {@link key}. The schema is
 * compiled on the first call to  {@link ajv.getSchema}.
 *
 * @returns A validate() function for Cart
 */
export const getCartSchema = () => getRequiredSchema<FoodstuffsCart>(key);

// Register schema with ajv instance
ajv.addSchema(schema, key);
