import { getEnv } from "utils/env";
import { readFile } from "fs/promises";
import path from "path";
import { basename } from "path/posix";
import { ReceiptScanner } from "receipt-ocr/receipts.model";
import { headers } from "utils/headers-builder";
import { Logger, prettyPrint } from "utils/logger";
import { RestService } from "utils/rest";
import { paths } from "./api";

const endpoint = "/api/receipt/v1/verbose/encoded";
const method = "post";
type ReceiptApi = paths[typeof endpoint][typeof method];
type ReceiptData = ReceiptApi["parameters"]["body"]["body"];
type ReceiptResponseOk = ReceiptApi["responses"]["200"]["schema"];
type ReceiptResponseError = ReceiptApi["responses"]["400"]["schema"];

/**
 * Parses text from an image of a receipt using the Taggun API. The API is
 * unfortunately very inaccurate when it comes to itemising PAK'n'SAVE receipts,
 * so it's being used as an overkill OCR tool.
 *
 * @see https://www.taggun.io/
 */
export class TaggunReceiptScanner extends RestService implements ReceiptScanner {
  protected readonly baseUrl = "https://api.taggun.io/";
  protected readonly logger = new Logger(this.constructor.name);
  private readonly apiKey = getEnv().TAGGUN_API_KEY;

  async scan(filePath: string): Promise<string> {
    const taggunRes = await this.fetchReceiptData(filePath);
    if ("statusCode" in taggunRes) {
      throw new Error(`Taggun returned an error: ${prettyPrint(taggunRes)}`);
    }
    if (!("text" in taggunRes) || !taggunRes.text?.text) {
      throw new Error(`Taggun didn't return text in response: ${prettyPrint(taggunRes)}`);
    }
    return taggunRes.text.text;
  }

  async fetchReceiptData(filePath: string): Promise<ReceiptResponseOk | ReceiptResponseError> {
    const imageData = await readFile(filePath, { encoding: "base64" });
    const body: ReceiptData = {
      image: imageData,
      contentType: this.getContentType(filePath),
      filename: basename(filePath),
      near: "Auckland, New Zealand",
      refresh: false,
      language: "en",
      extractTime: false,
      incognito: false,
    };
    return this.postForJson(
      this.buildUrl("api/receipt/v1/verbose/encoded"),
      headers()
        .acceptJson()
        .contentTypeJson()
        .apikey(this.apiKey)
        .append("Accept-Encoding", "gzip, deflate, br")
        .build(),
      body
    );
  }

  private getContentType(filePath: string) {
    const fileExt = path.extname(filePath);
    switch (fileExt.toLowerCase()) {
      case ".png":
        return "image/png";
      case ".pdf":
        return "application/pdf";
      default:
        return "image/jpeg";
    }
  }
}
