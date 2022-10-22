import { readFile } from "fs/promises";
import path from "path";
import { basename } from "path";
import { ReceiptScanner } from "@gt/receipt-ocr/receipts.model";
import { getEnvVar } from "@gt/utils/environment";
import { headersBuilder } from "@gt/utils/headers";
import { Logger, prettyPrint } from "@gt/utils/logger";
import { RestService } from "@gt/utils/rest";
import { paths } from "./api";
import { CacheService } from "@gt/utils/cache";
import { inject, Lifecycle, scoped } from "tsyringe";
import { AppTokens } from "@gt/app/di";
import { PromptProvider } from "@gt/prompts/prompt-provider";

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
@scoped(Lifecycle.ContainerScoped)
export class TaggunReceiptScanner extends RestService implements ReceiptScanner {
  protected readonly baseUrl = this.validateBaseUrl("https://api.taggun.io");
  protected readonly logger = new Logger(this.constructor.name);
  private readonly apiKey = getEnvVar("TAGGUN_API_KEY");
  private readonly cache = new CacheService<Record<string, ReceiptResponseOk>>("taggun");

  constructor(@inject("PromptProvider") private readonly prompt: PromptProvider) {
    super();
  }

  async scan(filePath: string): Promise<string> {
    const cacheKey = basename(filePath.slice(0, filePath.lastIndexOf(".")));
    const cachedResponse = await this.cache.get(cacheKey);
    let taggunRes: ReceiptResponseOk | ReceiptResponseError;
    if (cachedResponse) {
      const useCachedResponse = await this.prompt.confirm(
        `Use cached Taggun response for "${cacheKey}?"`
      );
      taggunRes = useCachedResponse ? cachedResponse : await this.fetchReceiptData(filePath);
    } else {
      taggunRes = await this.fetchReceiptData(filePath);
    }
    if ("statusCode" in taggunRes) {
      throw new Error(`Taggun returned an error: ${prettyPrint(taggunRes)}`);
    }
    if (!("text" in taggunRes) || !taggunRes.text?.text) {
      throw new Error(`Taggun didn't return text in response: ${prettyPrint(taggunRes)}`);
    }
    await this.cache.set(cacheKey, taggunRes);
    return taggunRes.text.text;
  }

  async fetchReceiptData(
    filePath: string,
    verbosity: "verbose" | "simple" = "verbose"
  ): Promise<ReceiptResponseOk | ReceiptResponseError> {
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
    return this.postAndParse(this.buildUrl(`api/receipt/v1/${verbosity}/encoded`), {
      headers: headersBuilder()
        .acceptJson()
        .contentTypeJson()
        .apikey(this.apiKey)
        .append("Accept-Encoding", "gzip, deflate, br")
        .build(),
      body: JSON.stringify(body),
    });
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
