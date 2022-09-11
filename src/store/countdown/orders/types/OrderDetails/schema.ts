import { ajv, getRequiredSchema } from "@gt/jtd/ajv";
import { UNKNOWN } from "@gt/jtd/infer";
import { JTDSchemaType } from "ajv/dist/jtd";
import { OrderDetails } from ".";

/**
 * This will cause a TypeScript compiler error if the OrderDetails type defined in
 * index.ts is modified in a way that makes it incompatible with the schema.
 */
export const schema: JTDSchemaType<OrderDetails> = {
  properties: {
    breadcrumb: {
      optionalProperties: {
        aisle: { metadata: { typescriptType: "unknown" } },
        department: { metadata: { typescriptType: "unknown" } },
        dynamicGroup: { metadata: { typescriptType: "unknown" } },
        productGroup: { metadata: { typescriptType: "unknown" } },
        shelf: { metadata: { typescriptType: "unknown" } },
      },
    },
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
            savings: { type: "string" },
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
            suburbId: { type: "uint8" },
          },
          optionalProperties: {
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
                onecardPointsBalance: { type: "uint16" },
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
    currentPageSize: { type: "uint8" },
    currentSortOption: { type: "string" },
    dasFacets: { elements: UNKNOWN },
    facets: { elements: UNKNOWN },
    isSuccessful: { type: "boolean" },
    partialFailures: {
      optionalProperties: {
        breadcrumbGenerationFailed: { metadata: { typescriptType: "unknown" } },
        maxSupplyLimitFetchFailed: { metadata: { typescriptType: "unknown" } },
        productGroupFetchFailed: { metadata: { typescriptType: "unknown" } },
        productTagFetchFailed: { metadata: { typescriptType: "unknown" } },
        purchaseUnitFetchFailed: { metadata: { typescriptType: "unknown" } },
        shopperNotesFetchFailed: { metadata: { typescriptType: "unknown" } },
        targetOfferFetchFailed: { metadata: { typescriptType: "unknown" } },
        trolleyQuantityUpdateFailed: { metadata: { typescriptType: "unknown" } },
      },
    },
    products: {
      properties: {
        items: {
          elements: {
            properties: {
              averageWeightPerUnit: { nullable: true, type: "float64" },
              barcode: { type: "string" },
              brand: { type: "string" },
              hasShopperNotes: { type: "boolean" },
              images: { properties: { big: { type: "string" }, small: { type: "string" } } },
              lastAvailableListPrice: { type: "uint8" },
              name: { type: "string" },
              price: {
                properties: {
                  averagePricePerSingleUnit: { nullable: true, type: "float64" },
                  canShowOriginalPrice: { type: "boolean" },
                  hasBonusPoints: { type: "boolean" },
                  isClubPrice: { type: "boolean" },
                  isNew: { type: "boolean" },
                  isSpecial: { type: "boolean" },
                  isTargetedOffer: { type: "boolean" },
                  originalPrice: { type: "float64" },
                  salePrice: { type: "float64" },
                  savePrice: { type: "float64" },
                },
                optionalProperties: {
                  discount: { metadata: { typescriptType: "unknown" } },
                  purchasingUnitPrice: { metadata: { typescriptType: "unknown" } },
                  total: { metadata: { typescriptType: "unknown" } },
                },
              },
              productTag: {
                nullable: true,
                properties: {
                  additionalTag: {
                    nullable: true,
                    properties: {
                      altText: { type: "string" },
                      imagePath: { type: "string" },
                      linkTarget: { type: "string" },
                      name: { type: "string" },
                    },
                    optionalProperties: { link: { metadata: { typescriptType: "unknown" } } },
                  },
                  multiBuy: {
                    nullable: true,
                    properties: {
                      link: { type: "string" },
                      quantity: { type: "uint8" },
                      value: { type: "float64" },
                    },
                  },
                  tagType: { type: "string" },
                },
                optionalProperties: {
                  bonusPoints: { metadata: { typescriptType: "unknown" } },
                  targetedOffer: { metadata: { typescriptType: "unknown" } },
                },
              },
              quantity: {
                properties: {
                  increment: { type: "float64" },
                  max: { type: "uint8" },
                  min: { type: "float64" },
                  value: { nullable: true, type: "float64" },
                },
                optionalProperties: {
                  purchasingQuantityString: { metadata: { typescriptType: "unknown" } },
                  quantityInOrder: { metadata: { typescriptType: "unknown" } },
                },
              },
              selectedPurchasingUnit: { type: "string" },
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
              stockLevel: { type: "uint8" },
              subsAllowed: { type: "boolean" },
              supportsBothEachAndKgPricing: { type: "boolean" },
              type: { type: "string" },
              unit: { type: "string" },
              variety: { nullable: true, type: "string" },
            },
            optionalProperties: {
              adId: { metadata: { typescriptType: "unknown" } },
              availabilityStatus: { metadata: { typescriptType: "unknown" } },
              eachUnitQuantity: { metadata: { typescriptType: "unknown" } },
              priceUnitLabel: { metadata: { typescriptType: "unknown" } },
            },
          },
        },
        totalItems: { type: "uint8" },
      },
    },
    rootUrl: { type: "string" },
    sortOptions: {
      elements: {
        properties: {
          selected: { type: "boolean" },
          text: { type: "string" },
          value: { type: "string" },
        },
      },
    },
  },
  optionalProperties: {
    action: { metadata: { typescriptType: "unknown" } },
    messages: { metadata: { typescriptType: "unknown" } },
    targetedOfferDetails: { metadata: { typescriptType: "unknown" } },
  },
};

/**
 * The key used to index the OrderDetails schema with ajv
 */
export const key = "src/store/countdown/orders/OrderDetails";

/**
 * The key used to index the OrderDetails[] schema with ajv
 */
export const arrayKey = key + "[]";

/**
 * Calls {@link ajv.getSchema} with the OrderDetails schema {@link key}. The schema is
 * compiled on the first call to  {@link ajv.getSchema}.
 *
 * @returns A validate() function for OrderDetails
 */
export const getOrderDetailsSchema = () => getRequiredSchema<OrderDetails>(key);

/**
 * Calls {@link ajv.getSchema} with the OrderDetailss schema {@link arrayKey}. The schema is
 * compiled on the first call to  {@link ajv.getSchema}.
 *
 * @returns A validate() function for an array of OrderDetailss
 */
export const getOrderDetailssSchema = () => getRequiredSchema<OrderDetails[]>(arrayKey);

// Register schemas with ajv
ajv.addSchema(schema, key);
ajv.addSchema({ elements: schema }, arrayKey);
