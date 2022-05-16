import { compileSchema } from "@gt/jtd/ajv";
import { UNKNOWN } from "@gt/jtd/infer";
import { JTDSchemaType } from "ajv/dist/core";
import { OrderDetails } from ".";

/**
 * This will cause a TypeScript compiler error if the Order type defined in
 * index.ts is modified in a way that makes it incompatible with the schema.
 */
const schema: JTDSchemaType<OrderDetails> = {
  properties: {
    breadcrumb: {
      optionalProperties: {
        aisle: {},
        department: {},
        dynamicGroup: {},
        productGroup: {},
        shelf: {},
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
                onecardPointsBalance: { type: "uint16" },
                redeemableRewardVouchers: { type: "uint8" },
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
    currentPageSize: { type: "uint8" },
    currentSortOption: { type: "string" },
    dasFacets: { elements: UNKNOWN },
    facets: { elements: UNKNOWN },
    isSuccessful: { type: "boolean" },
    partialFailures: {
      optionalProperties: {
        breadcrumbGenerationFailed: {},
        maxSupplyLimitFetchFailed: {},
        productGroupFetchFailed: {},
        productTagFetchFailed: {},
        purchaseUnitFetchFailed: {},
        shopperNotesFetchFailed: {},
        targetOfferFetchFailed: {},
        trolleyQuantityUpdateFailed: {},
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
                optionalProperties: { discount: {}, purchasingUnitPrice: {}, total: {} },
              },
              productTag: {
                nullable: true,
                properties: { tagType: { type: "string" } },
                optionalProperties: {
                  additionalTag: {},
                  bonusPoints: {},
                  multiBuy: {},
                  targetedOffer: {},
                },
              },
              quantity: {
                properties: {
                  increment: { type: "float64" },
                  max: { type: "uint8" },
                  min: { type: "float64" },
                  value: { nullable: true, type: "float64" },
                },
                optionalProperties: { purchasingQuantityString: {}, quantityInOrder: {} },
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
              subsAllowed: { type: "boolean" },
              supportsBothEachAndKgPricing: { type: "boolean" },
              type: { type: "string" },
              unit: { type: "string" },
              variety: { nullable: true, type: "string" },
            },
            optionalProperties: { adId: {}, eachUnitQuantity: {}, priceUnitLabel: {} },
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
  optionalProperties: { action: {}, messages: {}, targetedOfferDetails: {} },
};
export default schema;

export const OrderDetailsSchema = compileSchema<OrderDetails>(schema);
