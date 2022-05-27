import { getEnv } from "@gt/utils/environment";
import { headersBuilder } from "@gt/utils/headers";
import { Logger } from "@gt/utils/logger";
import { RestService } from "@gt/utils/rest";
import path from "path/posix";
import { ReceiptScanner } from "..";

export class OcrReceiptScanner extends RestService implements ReceiptScanner {
  protected readonly baseUrl = this.validateBaseUrl("https://api.ocr.space");
  protected readonly logger = new Logger(this.constructor.name);
  private readonly apikey = getEnv().OCR_API_KEY;

  async scan(filepath: string): Promise<string> {
    const response = await this.fetchReceiptData(filepath);
    return response.ParsedResults[0].ParsedText;
  }

  async fetchReceiptData(filepath: string): Promise<ScanResponse> {
    const formData = new FormData();
    formData.append("language", "eng");
    formData.append("url", filepath);
    return this.postAndParse(this.buildUrl("/parse/image"), {
      headers: headersBuilder()
        .apikey(this.apikey)
        .append("redirect", "follow")
        .append("OCREngine", "2")
        .build(),
      body: formData,
    });
  }

  private getContentType(filepath: string) {
    const fileExt = path.extname(filepath);
    switch (fileExt.toLowerCase()) {
      case ".png":
        return "image/png";
      case ".pdf":
        return "application/pdf";
      default:
        return "image/jpeg";
    }
  }

  private getFileType(filepath: string) {
    return path.extname(filepath).slice(1).toUpperCase();
  }
}

export interface ParsedResult {
  TextOrientation: string;
  FileParseExitCode: number;
  ParsedText: string;
  ErrorMessage: string;
  ErrorDetails: string;
}

export interface ScanResponse {
  ParsedResults: ParsedResult[];
  OCRExitCode: number;
  IsErroredOnProcessing: boolean;
  ProcessingTimeInMilliseconds: string;
}
