import { ReceiptItem, ReceiptItemiser } from "@gt/receipt-ocr/receipts.model";
import { Logger } from "@gt/utils/logger";
import { singleton } from "tsyringe";

/**
 * Itemises a PAK'n'SAVE/New World receipt.
 */
@singleton()
export class FoodstuffsReceiptItemiser implements ReceiptItemiser {
  private readonly logger = new Logger(this.constructor.name);

  itemise(text: string): Promise<ReceiptItem[]> {
    const lineIterator = text
      .trim()
      .split("\n")
      .map((line) => line.trim())
      [Symbol.iterator]();
    const items: ReceiptItem[] = [];

    for (
      let next = lineIterator.next();
      !next.done && typeof next.value === "string";
      next = lineIterator.next()
    ) {
      const line = next.value;
      if (line.startsWith("Supervisor") || line.startsWith("Restricted")) {
        continue;
      }
      const split = line.split("$");
      if (split.length === 1) {
        items.push(this.parseReceiptItemLine(line, lineIterator.next()));
        continue;
      }
      if (split.length === 2) {
        const name = split[0].trim();
        let amount = Number(split[1]);
        // Check if line represents a discount
        if (name.endsWith(" -")) {
          amount *= -1;
        }
        // TODO: implement unit
        items.push({ name, amount });
      }
      this.logger.debug(`Weird line split length: ["${split.join('", "')}"]`);
    }
    return Promise.resolve(items);
  }

  private parseReceiptItemLine(
    item: string,
    quantityLine: IteratorResult<string, void>
  ): ReceiptItem {
    if (quantityLine.done || !quantityLine.value) {
      throw new Error(`Expected a quantity line after ${item}, but reached EOF`);
    }
    const quantityLineValue = quantityLine.value.trim();
    const quantitySplit = quantityLineValue.split("$");
    if (quantitySplit.length === 2) {
      const [amount, price] = quantitySplit;
      return { name: `${item} (${amount.trim()})`, amount: Number(price) };
    }
    if (quantitySplit.length === 3) {
      return {
        name: `${item} (${quantitySplit[0]}$${quantitySplit[1].trim()})`,
        amount: Number(quantitySplit[2]),
      };
    }
    throw new Error(`Expected a quantity line after ${item}, but found ${quantityLineValue}`);
  }
}
