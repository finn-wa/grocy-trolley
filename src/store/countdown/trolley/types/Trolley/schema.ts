import { ajv, getRequiredSchema } from "@gt/jtd/ajv";
import { UNKNOWN } from "@gt/jtd/infer";
import { JTDSchemaType } from "ajv/dist/jtd";
import { Trolley } from ".";

/**
 * This will cause a TypeScript compiler error if the Trolley type defined in
 * index.ts is modified in a way that makes it incompatible with the schema.
 */
export const schema: JTDSchemaType<Trolley> = {
  properties: {
    context: {
      properties: {
        advancedSettingsResponse: {
          properties: {
            allowBannerRotation: { type: "boolean" },
            itemLevelSubstitution: { type: "boolean" },
            showHaveYouForgotten: { type: "boolean" },
          },
        },
        basketTotals: {
          properties: {
            bagFees: { type: "string" },
            deliveryFees: { type: "string" },
            eligibilityForDeliverySubscriptionDiscount: { type: "string" },
            savings: { type: "string", nullable: true },
            subtotal: { type: "string" },
            totalIncludingDeliveryFees: { type: "string" },
            totalItems: { type: "uint16" },
          },
        },
        enabledFeatures: { elements: { type: "string" } },
        fulfilment: {
          properties: {
            address: { type: "string" },
            areaId: { type: "uint16" },
            expressFulfilment: {
              properties: {
                isExpressSlot: { type: "boolean" },
                isLastExpressHourWindow: { type: "boolean" },
              },
            },
            fulfilmentStoreId: { type: "uint16" },
            isAddressInDeliveryZone: { type: "boolean" },
            isDefaultDeliveryAddress: { type: "boolean" },
            isSlotToday: { type: "boolean" },
            method: { type: "string" },
            perishableCode: { type: "string" },
            suburbId: { type: "uint16" },
          },
          optionalProperties: {
            cutOffTime: {},
            endTime: {},
            locker: {},
            selectedDate: {},
            selectedDateWithTZInfo: {},
            startTime: {},
          },
        },
        shopper: {
          properties: {
            firstName: { type: "string" },
            hasActiveDeliverySubscription: { type: "boolean" },
            hasOnecard: { type: "boolean" },
            isChangingOrder: { type: "boolean" },
            isLoggedIn: { type: "boolean" },
            isPriorityShopper: { type: "boolean" },
            isShopper: { type: "boolean" },
            isSupplyLimitOverrideShopper: { type: "boolean" },
            oneCardBalance: {
              properties: {
                isOneCardInError: { type: "boolean" },
                oneCardCurrency: { type: "string" },
                oneCardNumber: { type: "string" },
                onecardPointsBalance: { type: "uint16", nullable: true },
                redeemableRewardVouchers: { type: "uint16" },
              },
              optionalProperties: { continuitySpend: {} },
            },
            orderCount: { type: "string" },
            sessionGroups: { elements: { type: "uint16" } },
            shopperIdHash: { type: "string" },
            shopperScvId: { type: "string" },
          },
          optionalProperties: { changingOrderId: {} },
        },
        shoppingListItems: { elements: { type: "string" } },
      },
    },
    isSuccessful: { type: "boolean" },
    itemCount: { type: "uint16" },
    items: {
      elements: {
        properties: {
          categoryDescription: { type: "string" },
          categoryType: { type: "string" },
          products: {
            elements: {
              properties: {
                averageWeightPerUnit: { nullable: true, type: "float64" },
                hasShopperNotes: { type: "boolean" },
                images: { properties: { big: { type: "string" }, small: { type: "string" } } },
                name: { type: "string" },
                price: {
                  properties: {
                    averagePricePerSingleUnit: { nullable: true, type: "float64" },
                    canShowOriginalPrice: { type: "boolean" },
                    discount: { nullable: true, type: "string" },
                    hasBonusPoints: { type: "boolean" },
                    isClubPrice: { type: "boolean" },
                    isNew: { type: "boolean" },
                    isSpecial: { type: "boolean" },
                    isTargetedOffer: { type: "boolean" },
                    originalPrice: { type: "float64" },
                    salePrice: { type: "float64" },
                    savePrice: { type: "float64" },
                    total: { nullable: true, type: "string" },
                  },
                  optionalProperties: { purchasingUnitPrice: {} },
                },
                priceUnitLabel: { type: "string" },
                productTag: {
                  nullable: true,
                  properties: {
                    multiBuy: {
                      nullable: true,
                      properties: {
                        link: { type: "string" },
                        quantity: { type: "uint16" },
                        value: { type: "uint16" },
                      },
                    },
                    tagType: { type: "string" },
                  },
                  optionalProperties: { additionalTag: {}, bonusPoints: {}, targetedOffer: {} },
                },
                quantity: {
                  properties: {
                    increment: { type: "float64" },
                    max: { type: "uint16" },
                    min: { type: "float64" },
                    purchasingQuantityString: { type: "string" },
                    quantityInOrder: { type: "float64" },
                    value: { type: "float64" },
                  },
                },
                selectedPurchasingUnit: { nullable: true, type: "string" },
                size: {
                  properties: {
                    cupMeasure: { nullable: true, type: "string" },
                    cupPrice: { type: "float64" },
                    packageType: { nullable: true, type: "string" },
                    volumeSize: { nullable: true, type: "string" },
                  },
                },
                sku: { type: "string" },
                slug: { type: "string" },
                subsAllowed: { type: "boolean" },
                supportsBothEachAndKgPricing: { type: "boolean" },
                type: { type: "string" },
                unit: { type: "string" },
              },
              optionalProperties: {
                dasFacetsUrl: { type: "string" },
                shopperNotes: { type: "string" },
                adId: {},
                barcode: {},
                brand: {},
                eachUnitQuantity: {},
                variety: {},
              },
            },
          },
        },
      },
    },
    messages: { elements: UNKNOWN },
    rootUrl: { type: "string" },
  },
};

/**
 * The key used to index the Trolley schema with ajv
 */
export const key = "src/store/countdown/trolley/Trolley";

/**
 * Calls {@link ajv.getSchema} with the Trolley schema {@link key}. The schema is
 * compiled on the first call to  {@link ajv.getSchema}.
 *
 * @returns A validate() function for Trolley
 */
export const getTrolleySchema = () => getRequiredSchema<Trolley>(key);

// Register schema with ajv instance
ajv.addSchema(schema, key);
