import { GrocerApiService } from "@gt/grocer/api/grocer-api-service";
import { GrocerStoreService } from "@gt/grocer/stores/grocer-store-service";
import { PromptProvider } from "@gt/prompts/prompt-provider";
import barcodes from "@gt/test/data/barcodes.json";
import { FoodstuffsBarcodeImporter } from "./foodstuffs-barcode-importer";
import { FoodstuffsReceiptImporter } from "./receipt-importer";

describe("[internal] FoodstuffsBarcodeImporter", () => {
  const service = new FoodstuffsBarcodeImporter(
    null as unknown as FoodstuffsReceiptImporter,
    null as unknown as GrocerStoreService,
    null as unknown as GrocerApiService,
    null as unknown as PromptProvider
  );

  describe("readBarcodesFromFile", () => {
    it("should parse a json file", async () => {
      const parsedBarcodes = await service.readBarcodesFromFile("src/test/data/barcodes.json");
      expect(parsedBarcodes).toEqual(barcodes);
    });

    it("should parse a text file", async () => {
      const parsedBarcodes = await service.readBarcodesFromFile("src/test/data/barcodes.txt");
      expect(parsedBarcodes).toEqual(barcodes);
    });
  });
});
