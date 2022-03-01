import { getEnv } from "@grocy-trolley/env";
import { ElementHandle, firefox } from "playwright";

export class BarcodeBuddyScraper {
  private readonly url: string = getEnv().BARCODEBUDDY_URL;

  async getBarcodes(): Promise<string[]> {
    const browser = await firefox.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(this.url);
    const tables = await page.$$("table");
    const tableBarcodes = await Promise.all(
      tables.map((table) => this.getBarcodesFromTable(table))
    );
    return tableBarcodes.flat();
  }

  private async getBarcodesFromTable(table: ElementHandle): Promise<string[]> {
    const headers = await table.$$("th");
    const headerNames = await Promise.all(headers.map((header) => header.innerText()));
    const barcodeChildNum = headerNames.indexOf("Barcode") + 1;
    const barcodeCells = await table.$$(`tr > td:nth-child(${barcodeChildNum})`);
    return Promise.all(barcodeCells.map((cell) => cell.innerText()));
  }
}
