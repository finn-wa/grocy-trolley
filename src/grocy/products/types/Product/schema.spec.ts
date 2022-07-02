import { testSchemaWithSamples } from "@gt/jtd/test-utils";
import {
  parseProduct,
  parseProductUserfields,
  Product,
  ProductUserfields,
  RawProduct,
  RawProductUserfields,
} from ".";
import samples from "./samples.json";
import { getRawProductSchema } from "./schema";

describe("RawProduct Schema", () => {
  const validate = getRawProductSchema();
  testSchemaWithSamples(validate, samples as RawProduct[]);

  test("parseProductUserfields for a parent product", () => {
    expect(parseProductUserfields({ isParent: "1", storeMetadata: null })).toEqual({
      isParent: true,
      storeMetadata: null,
    });
  });

  test("parseProductUserfields for a PNS product", () => {
    const rawUserfields: RawProductUserfields = {
      isParent: "0",
      storeMetadata:
        '{"PNS":{"productId":"5007625-EA-000","quantity":1,"sale_type":"UNITS","name":"Firm Style Plain Tofu","price":349,"catalogPrice":0,"hasBadge":true,"badgeImageUrl":"/assets/images/PNS/6000-Extra_Low.svg","imageUrl":"https://a.fsimg.co.nz/product/retail/fan/image/100x100/5007625.png","restricted":false,"tobacco":false,"liquor":false,"saleTypes":[{"minUnit":1,"type":"UNITS","stepSize":1,"unit":"ea"}],"weightDisplayName":"300g","brand":"Bean Supreme","categoryName":"Canned & Prepared Foods","promoBadgeImageTitle":"Extra Low","promotionCode":"6000"},"receiptNames":["BEAN SUPREME TOFU FIRM 300G"]}',
    };
    const parsedUserfields: ProductUserfields = {
      isParent: false,
      storeMetadata: {
        PNS: {
          badgeImageUrl: "/assets/images/PNS/6000-Extra_Low.svg",
          brand: "Bean Supreme",
          catalogPrice: 0,
          categoryName: "Canned & Prepared Foods",
          hasBadge: true,
          imageUrl: "https://a.fsimg.co.nz/product/retail/fan/image/100x100/5007625.png",
          liquor: false,
          name: "Firm Style Plain Tofu",
          price: 349,
          productId: "5007625-EA-000",
          promoBadgeImageTitle: "Extra Low",
          promotionCode: "6000",
          quantity: 1,
          restricted: false,
          saleTypes: [
            {
              minUnit: 1,
              stepSize: 1,
              type: "UNITS",
              unit: "ea",
            },
          ],
          sale_type: "UNITS",
          tobacco: false,
          weightDisplayName: "300g",
        },
        receiptNames: ["BEAN SUPREME TOFU FIRM 300G"],
      },
    };
    expect(parseProductUserfields(rawUserfields)).toEqual(parsedUserfields);
  });

  test("parseProduct", () => {
    const rawProduct: RawProduct = {
      id: "611",
      name: "Butter (Generic)",
      description: "<p>Baking butter<br /></p>",
      product_group_id: "53",
      active: "1",
      location_id: "3",
      shopping_location_id: "",
      qu_id_purchase: "2",
      qu_id_stock: "2",
      qu_factor_purchase_to_stock: "1.0",
      min_stock_amount: "1",
      default_best_before_days: "0",
      default_best_before_days_after_open: "0",
      default_best_before_days_after_freezing: "0",
      default_best_before_days_after_thawing: "0",
      picture_file_name: null,
      enable_tare_weight_handling: "0",
      tare_weight: "0.0",
      not_check_stock_fulfillment_for_recipes: "0",
      parent_product_id: null,
      calories: "0",
      cumulate_min_stock_amount_of_sub_products: "1",
      due_type: "1",
      quick_consume_amount: "1.0",
      hide_on_stock_overview: "0",
      default_stock_label_type: "0",
      should_not_be_frozen: "0",
      row_created_timestamp: "2022-03-08 11:11:18",
      treat_opened_as_out_of_stock: "1",
      no_own_stock: "0",
      default_consume_location_id: null,
      userfields: { isParent: "1", storeMetadata: null },
    };
    const parsedProduct: Product = {
      id: "611",
      name: "Butter (Generic)",
      description: "<p>Baking butter<br /></p>",
      product_group_id: "53",
      active: true,
      location_id: "3",
      shopping_location_id: null,
      qu_id_purchase: "2",
      qu_id_stock: "2",
      qu_factor_purchase_to_stock: 1.0,
      min_stock_amount: 1,
      default_best_before_days: 0,
      default_best_before_days_after_open: 0,
      default_best_before_days_after_freezing: 0,
      default_best_before_days_after_thawing: 0,
      picture_file_name: null,
      enable_tare_weight_handling: false,
      tare_weight: 0.0,
      not_check_stock_fulfillment_for_recipes: false,
      parent_product_id: null,
      calories: 0,
      cumulate_min_stock_amount_of_sub_products: true,
      due_type: 1,
      quick_consume_amount: 1.0,
      hide_on_stock_overview: false,
      default_stock_label_type: 0,
      should_not_be_frozen: false,
      row_created_timestamp: "2022-03-08 11:11:18",
      treat_opened_as_out_of_stock: true,
      no_own_stock: false,
      default_consume_location_id: null,
      userfields: { isParent: true, storeMetadata: null },
    };
    expect(parseProduct(rawProduct)).toEqual(parsedProduct);
  });
});
