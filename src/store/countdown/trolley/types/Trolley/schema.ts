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
            savings: { nullable: true, type: "string" },
            subtotal: { type: "string" },
            totalIncludingDeliveryFees: { type: "string" },
            totalItems: { type: "uint8" },
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
            pickupAddressId: { type: "uint8" },
          },
          optionalProperties: {
            suburbId: { type: "uint8" },
            cutOffTime: { metadata: { typescriptType: "unknown" } },
            endTime: { metadata: { typescriptType: "unknown" } },
            locker: { metadata: { typescriptType: "unknown" } },
            selectedDate: { metadata: { typescriptType: "unknown" } },
            selectedDateWithTZInfo: { metadata: { typescriptType: "unknown" } },
            startTime: { metadata: { typescriptType: "unknown" } },
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
                onecardPointsBalance: { nullable: true, type: "uint16" },
                redeemableRewardVouchers: { type: "uint8" },
              },
              optionalProperties: { continuitySpend: { metadata: { typescriptType: "unknown" } } },
            },
            orderCount: { type: "string" },
            sessionGroups: { elements: { type: "uint16" } },
            shopperIdHash: { type: "string" },
            shopperScvId: { type: "string" },
          },
          optionalProperties: { changingOrderId: { metadata: { typescriptType: "unknown" } } },
        },
        shoppingListItems: { elements: { type: "string" } },
      },
    },
    isSuccessful: { type: "boolean" },
    itemCount: { type: "uint8" },
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
                lastAvailableListPrice: { type: "uint8" },
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
                    orderedPrice: { type: "float64", nullable: true },
                    salePrice: { type: "float64" },
                    savePrice: { type: "float64" },
                    total: { nullable: true, type: "string" },
                  },
                  optionalProperties: {
                    purchasingUnitPrice: { metadata: { typescriptType: "unknown" } },
                  },
                },
                priceUnitLabel: { type: "string" },
                productTag: {
                  nullable: true,
                  properties: {
                    tagType: { type: "string" },
                  },
                  optionalProperties: {
                    bonusPoints: { metadata: { typescriptType: "unknown" } },
                    multiBuy: {
                      nullable: true,
                      properties: {
                        link: { type: "string" },
                        quantity: { type: "uint8" },
                        value: { type: "uint8" },
                      },
                    },
                    additionalTag: {
                      nullable: true,
                      properties: {
                        imagePath: { type: "string" },
                        linkTarget: { type: "string" },
                        name: { type: "string" },
                      },
                      optionalProperties: {
                        altText: { type: "string", nullable: true },
                        link: { type: "string", nullable: true },
                      },
                    },
                    targetedOffer: { metadata: { typescriptType: "unknown" } },
                  },
                },
                quantity: {
                  properties: {
                    increment: { type: "float64" },
                    max: { type: "uint8" },
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
                    volumeSize: { type: "string", nullable: true },
                  },
                },
                sku: { type: "string" },
                slug: { type: "string" },
                stockLevel: { type: "uint8" },
                subsAllowed: { type: "boolean" },
                supportsBothEachAndKgPricing: { type: "boolean" },
                type: { type: "string" },
                unit: { type: "string" },
              },
              optionalProperties: {
                adId: { metadata: { typescriptType: "unknown" } },
                availabilityStatus: { metadata: { typescriptType: "unknown" } },
                barcode: { metadata: { typescriptType: "unknown" } },
                brand: { metadata: { typescriptType: "unknown" } },
                brandSuggestionId: { metadata: { typescriptType: "unknown" } },
                brandSuggestionName: { metadata: { typescriptType: "unknown" } },
                eachUnitQuantity: { metadata: { typescriptType: "unknown" } },
                variety: { metadata: { typescriptType: "unknown" } },
              },
              additionalProperties: true,
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

// Register schema with ajv
ajv.addSchema(schema, key);
