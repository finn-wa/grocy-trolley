import { ReceiptItem, ReceiptItemiser } from "..";

/**
 * Itemises a PAK'n'SAVE receipt.
 */
export class PakNSaveReceiptItemiser implements ReceiptItemiser {
  itemise(text: string): Promise<ReceiptItem[]> {
    const lines = text.split("\n")[Symbol.iterator]();
    const items: ReceiptItem[] = [];
    let line: IteratorResult<string, void>;
    do {
      line = lines.next();
      if (!line.value) break;
      const lineValue = line.value.trim();
      if (lineValue.startsWith("Supervisor")) {
        continue;
      }
      const split = lineValue.split("$");
      if (split.length === 1) {
        const item = lineValue;
        line = lines.next();
        items.push(this.parseQuantity(item, line));
      } else if (split.length === 2) {
        const name = split[0].trim();
        let amount = Number(split[1]);
        // Check if line represents a discount
        if (name.endsWith(" -")) {
          amount *= -1;
        }
        items.push({ name, amount });
      }
    } while (!line.done);
    return Promise.resolve(items);
  }

  private parseQuantity(item: string, quantityLine: IteratorResult<string, void>): ReceiptItem {
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
