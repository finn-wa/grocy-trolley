import {
  afterAllFoodstuffsTests,
  beforeAllFoodstuffsTests,
  foodstuffsTestContainer,
} from "../../test/foodstuffs-test-utils";
import { FoodstuffsBarcodeImporter } from "./foodstuffs-barcode-importer";
import barcodes from "@gt/test/data/barcodes.json";

describe("FoodstuffsBarcodeImporter", () => {
  let service: FoodstuffsBarcodeImporter;

  beforeAll(beforeAllFoodstuffsTests);

  beforeEach(() => {
    service = foodstuffsTestContainer().resolve(FoodstuffsBarcodeImporter);
  });

  afterAll(afterAllFoodstuffsTests);

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
