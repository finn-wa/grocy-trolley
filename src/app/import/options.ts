import { ajv, getRequiredSchema } from "@gt/jtd/ajv";
import { JTDSchemaType } from "ajv/dist/core";
import { Vendor } from "..";

export const IMPORT_SOURCES = ["cart", "order", "list", "receipt", "barcodes"] as const;
export type ImportSource = typeof IMPORT_SOURCES[number];

export interface WithVendor {
  vendor: Vendor;
}

export interface BaseImportOptions extends WithVendor {
  source: ImportSource;
  stock?: boolean;
}

export interface ImportCartOptions extends BaseImportOptions {
  source: "cart";
}

export interface ImportOrderOptions extends BaseImportOptions {
  source: "order";
}

export interface ImportListOptions extends BaseImportOptions {
  source: "list";
  listId?: string;
}

export interface ImportReceiptOptions extends BaseImportOptions {
  source: "receipt";
  file?: string;
}

export interface ImportBarcodesOptions extends BaseImportOptions {
  source: "barcodes";
  barcodes?: string[];
  file?: string;
}

export type ImportOptions =
  | ImportCartOptions
  | ImportOrderOptions
  | ImportListOptions
  | ImportReceiptOptions
  | ImportBarcodesOptions;

const optionsSchema: JTDSchemaType<BaseImportOptions> = {
  properties: {
    source: { enum: [...IMPORT_SOURCES] },
    vendor: { enum: ["cd", "nw", "pns"] },
  },
  optionalProperties: {
    stock: { type: "boolean" },
  },
  additionalProperties: true,
};
const optionsSchemaKey = "ImportOptions";
ajv.addSchema(optionsSchema, optionsSchemaKey);
export const getImportOptionsSchema = () => getRequiredSchema(optionsSchemaKey);
