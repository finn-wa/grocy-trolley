import { getEnv } from "env";
import { FormData } from "formdata-node";
import path from "path/posix";
import { headers } from "utils/headers-builder";
import { Logger } from "utils/logger";
import { RestService } from "utils/rest";
import { ReceiptScanner } from "..";

export class OcrReceiptScanner extends RestService implements ReceiptScanner {
  protected readonly baseUrl = "https://api.ocr.space/";
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
    const res = await this.post(
      this.buildUrl("parse/image"),
      headers().apikey(this.apikey).append("redirect", "follow").append("OCREngine", "2").build(),
      formData
    );
    return JSON.parse(await this.extractText(res));
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
