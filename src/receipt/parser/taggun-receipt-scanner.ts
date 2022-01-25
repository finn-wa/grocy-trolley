import { ReceiptScanner } from "..";
import { paths } from "./types/taggun";
import FormData from "form-data";
import fs from "fs";
import fetch from "node-fetch";
import path from "path";
import { Env } from "../../resources/env";

const endpoint = "/api/receipt/v1/verbose/file";
const method = "post";
type ReceiptApi = paths[typeof endpoint][typeof method];
type ReceiptFormData = ReceiptApi["parameters"]["formData"];
type ReceiptResponseOk = ReceiptApi["responses"]["200"]["schema"];
type ReceiptResponseError = ReceiptApi["responses"]["400"]["schema"];

/**
 * Parses text from an image of a receipt using the Taggun API. The API is
 * unfortunately very inaccurate when it comes to itemising PAK'n'SAVE receipts,
 * so it's being used as an overkill OCR tool.
 *
 * @see https://www.taggun.io/
 */
export class TaggunReceiptScanner implements ReceiptScanner {
  constructor(private readonly env: Env) {}

  async scan(filePath: string): Promise<string> {
    const taggunRes = await this.fetchReceiptData(filePath);
    if ("statusCode" in taggunRes) {
      throw new Error(`Taggun returned an error: ${JSON.stringify(taggunRes, undefined, 2)}`);
    }
    if (!("text" in taggunRes) || !taggunRes.text?.text) {
      throw new Error(
        `Taggun didn't return text in response: ${JSON.stringify(taggunRes, undefined, 2)}`
      );
    }
    return taggunRes.text.text;
  }

  async fetchReceiptData(filePath: string): Promise<ReceiptResponseOk | ReceiptResponseError> {
    const url = "https://api.taggun.io" + endpoint;
    const headers = {
      accept: "application/json",
      apikey: this.env.taggunApiKey,
      contentType: this.getContentType(filePath),
    };
    const body = this.createFormData(filePath, { refresh: false, language: "en" });
    const response = await fetch(url, { headers, method, body });
    return response.json();
  }

  private createFormData(filePath: string, data: ReceiptFormData): FormData {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, (value as any).toString());
    });
    const fileStream = fs.createReadStream(filePath, { autoClose: true });
    formData.append("file", fileStream, {
      filename: path.basename(filePath),
      contentType: this.getContentType(filePath),
    });
    return formData;
  }

  private getContentType(filePath: string) {
    const fileExt = path.extname(filePath);
    switch (fileExt.toLowerCase()) {
      case ".png":
        return "image/png";
      case ".pdf":
        return "application/pdf";
      default:
        return "image/jpg";
    }
  }
}
