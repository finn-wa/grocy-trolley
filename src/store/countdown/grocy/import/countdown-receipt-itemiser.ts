import { ReceiptItem, ReceiptItemiser } from "@gt/receipt-ocr/receipts.model";
import { Logger } from "@gt/utils/logger";

/**
 * Itemises a Countdown receipt.
 */
export class CountdownReceiptItemiser implements ReceiptItemiser {
  private readonly logger = new Logger(this.constructor.name);

  itemise(text: string): Promise<ReceiptItem[]> {
    throw new Error("Unimplemented");
  }
}
