import { getEnv } from "@grocy-trolley/env";
import { headers } from "@grocy-trolley/utils/headers-builder";
import { Logger } from "@grocy-trolley/utils/logger";
import { RestService } from "@grocy-trolley/utils/rest";
import { HTMLElement, parse } from "node-html-parser";

export class BarcodeBuddyService extends RestService {
  protected readonly baseUrl: `${string}/`;
  protected readonly logger = new Logger(this.constructor.name);

  constructor() {
    super();
    this.baseUrl = this.validateBaseUrl(getEnv().BARCODEBUDDY_URL);
  }

  async getBarcodes(): Promise<BarcodeBuddyBarcode[]> {
    const pageText = await this.get(
      this.buildUrl("index.php"),
      headers().accept("text/html").build()
    ).then((body) => this.extractText(body));
    const page = parse(pageText);
    return page.querySelectorAll("table").flatMap((t) => this.parseBarcodes(t));
  }

  private parseBarcodes(table: HTMLElement): BarcodeBuddyBarcode[] {
    const headers = table.querySelectorAll("th").map((header) => header.innerText);
    const getCells = (headerName: string) => {
      const selector = `tr > td:nth-child(${headers.indexOf(headerName) + 1})`;
      return table.querySelectorAll(selector).map((cell) => cell.innerText);
    };
    const names = getCells("Name");
    console.log(names);
    return getCells("Barcode").map((barcode, i) => ({ barcode, name: names[i] }));
  }
}

export interface BarcodeBuddyBarcode {
  name: string;
  barcode: string;
}
