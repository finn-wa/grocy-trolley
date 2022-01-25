import { ReceiptItem } from "../receipt";

export interface Product {}

/**
 * Resolves receipt items into products on PAK'n'SAVE's website.
 */
export interface ProductResolver {
  resolve(items: ReceiptItem[]): Promise<Product[]>;
}
