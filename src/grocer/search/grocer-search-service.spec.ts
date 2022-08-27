import { container } from "tsyringe";
import { GrocerSearchService } from "./grocer-search-service";

describe("GrocerSearchService", () => {
  let service: GrocerSearchService;
  const storeIds = [
    7827283001481225, 7644797357623558, 7831753237935622, 6388691745451615, 1029985494883640,
    3067760475684734, 295545393078205,
  ];
  beforeEach(() => {
    service = container.resolve(GrocerSearchService);
  });

  test("search for apples", async () => {
    const response = await service.search("apples", storeIds);
    expect(response?.hits.length).toBeGreaterThan(0);
  });
});
