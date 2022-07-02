import { ajv, getRequiredSchema } from "@gt/jtd/ajv";
import { JTDSchemaType } from "ajv/dist/jtd";
import { RawProduct } from ".";

/**
 * This will cause a TypeScript compiler error if the RawProduct type defined in
 * index.ts is modified in a way that makes it incompatible with the schema.
 */
export const schema: JTDSchemaType<RawProduct> = {
  properties: {
    active: { type: "string" },
    calories: { nullable: true, type: "string" },
    cumulate_min_stock_amount_of_sub_products: { type: "string" },
    default_best_before_days: { type: "string" },
    default_best_before_days_after_freezing: { type: "string" },
    default_best_before_days_after_open: { type: "string" },
    default_best_before_days_after_thawing: { type: "string" },
    default_consume_location_id: { nullable: true, type: "string" },
    default_stock_label_type: { type: "string" },
    description: { type: "string" },
    due_type: { type: "string" },
    enable_tare_weight_handling: { type: "string" },
    hide_on_stock_overview: { type: "string" },
    id: { type: "string" },
    location_id: { type: "string" },
    min_stock_amount: { type: "string" },
    name: { type: "string" },
    no_own_stock: { type: "string" },
    not_check_stock_fulfillment_for_recipes: { type: "string" },
    parent_product_id: { nullable: true, type: "string" },
    picture_file_name: { nullable: true, type: "string" },
    product_group_id: { type: "string" },
    qu_factor_purchase_to_stock: { type: "string" },
    qu_id_purchase: { type: "string" },
    qu_id_stock: { type: "string" },
    quick_consume_amount: { type: "string" },
    row_created_timestamp: { type: "string" },
    shopping_location_id: { nullable: true, type: "string" },
    should_not_be_frozen: { type: "string" },
    tare_weight: { type: "string" },
    treat_opened_as_out_of_stock: { type: "string" },
    userfields: {
      properties: {
        isParent: { enum: ["0", "1"] },
        storeMetadata: { nullable: true, type: "string" },
      },
    },
  },
};

/**
 * The key used to index the RawProduct schema with ajv
 */
export const key = "src/grocy/products/RawProduct";
export const arrayKey = `${key}[]`;

/**
 * Calls {@link ajv.getSchema} with the RawProduct schema {@link key}. The schema is
 * compiled on the first call to  {@link ajv.getSchema}.
 *
 * @returns A validate() function for RawProduct
 */
export const getRawProductSchema = () => getRequiredSchema<RawProduct>(key);

/**
 * Calls {@link ajv.getSchema} with the RawProducts schema {@link arrayKey}. The
 * schema is compiled on the first call to  {@link ajv.getSchema}.
 *
 * @returns A validate() function for an array of RawProducts
 */
export const getRawProductsSchema = () => getRequiredSchema<RawProduct[]>(arrayKey);

// Register schemas with ajv instance
ajv.addSchema(schema, key);
ajv.addSchema({ elements: schema }, arrayKey);
