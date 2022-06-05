import { QuantityUnit } from "@gt/grocy";

export interface ReceiptItem {
  name: string;
  amount: number;
  unit?: QuantityUnit;
}

/**
 * Extracts text from a receipt. Needs to be used in conjunction with a
 * ReceiptItemiser to get ReceiptItems.
 */
export interface ReceiptScanner {
  /**
   * Scans a receipt and returns the text as a string.
   *
   * @param filePath Path to receipt file
   * @returns Text on the receipt
   */
  scan(filePath: string): Promise<string>;
}

/** Parses the text from a receipt into ReceiptItems. */
export interface ReceiptItemiser {
  /**
   * Extracts items from text on a receipt.
   *
   * @param text Text from the receipt
   * @returns Items listed on the receipt.
   */
  itemise(text: string): Promise<ReceiptItem[]>;
}
