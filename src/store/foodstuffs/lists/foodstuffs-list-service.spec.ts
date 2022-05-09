import { getEnvAs, initEnv } from "@gt/utils/environment";
import { FoodstuffsUserAgent, LoginDetails } from "../rest/foodstuffs-user-agent";
import { getBrowser } from "../services";
import { FoodstuffsListService } from "./foodstuffs-list-service";
import { ListProductRef } from "./foodstuffs-list.model";

class ProductRefs {
  get milk(): ListProductRef {
    return { productId: "5201479-EA-000", quantity: 1, saleType: "UNITS" };
  }

  get carrots(): ListProductRef {
    return { productId: "5039965-KGM-000", quantity: 500, saleType: "WEIGHT" };
  }

  get bread(): ListProductRef {
    return { productId: "5011078-EA-000", quantity: 1, saleType: "UNITS" };
  }
  get manyItems(): ListProductRef[] {
    // unformatted: 5025751_EA_000PNS
    return [
      { productId: "5025751-EA-000", saleType: "UNITS", quantity: 1 },
      { productId: "5040543-EA-000", saleType: "UNITS", quantity: 1 },
      { productId: "5046503-EA-000", saleType: "UNITS", quantity: 1 },
      { productId: "5034241-EA-000", saleType: "UNITS", quantity: 1 },
      { productId: "5001241-EA-000", saleType: "UNITS", quantity: 1 },
      { productId: "5269328-EA-000", saleType: "UNITS", quantity: 1 },
      { productId: "5039965-KGM-000", saleType: "BOTH", quantity: 1 },
      { productId: "5039995-KGM-000", saleType: "BOTH", quantity: 1 },
      { productId: "5294812-EA-000", saleType: "UNITS", quantity: 1 },
      { productId: "5010008-EA-000", saleType: "UNITS", quantity: 1 },
      { productId: "5045921-EA-000", saleType: "UNITS", quantity: 1 },
      { productId: "5006357-EA-000", saleType: "UNITS", quantity: 1 },
      { productId: "5018301-EA-000", saleType: "UNITS", quantity: 1 },
      { productId: "5017803-EA-000", saleType: "UNITS", quantity: 1 },
    ];
  }
}

describe("FoodstuffsListService", () => {
  let listService: FoodstuffsListService;
  const refs = new ProductRefs();

  initEnv({ envFilePath: ".test.env" });
  const loginDetails: LoginDetails = getEnvAs({
    PAKNSAVE_EMAIL: "email",
    PAKNSAVE_PASSWORD: "password",
  });
  const productIdsOf = (products: { productId: string }[]) =>
    products.map((p) => p.productId).sort();

  beforeEach(async () => {
    const userAgent = new FoodstuffsUserAgent(getBrowser, loginDetails);
    listService = new FoodstuffsListService(userAgent);
    const lists = await listService.getLists();
    await Promise.all(lists.map((list) => listService.deleteList(list.listId)));
  });

  describe("unit tests", () => {
    test("getLists", async () => {
      const lists = await listService.getLists();
      expect(lists).toEqual([]);
    });

    test("createList", async () => {
      const name = "test create list";
      const list = await listService.createList(name);
      expect(list.name).toEqual(name);
      expect(list.products).toEqual([]);
      expect(list.listId).toBeTruthy();
    });

    test("updateList", async () => {
      const name = "test update list";
      const { listId } = await listService.createList(name);
      const products = [refs.bread, refs.carrots];
      const list = await listService.updateList({ listId, products });
      expect(list.listId).toEqual(listId);
      expect(productIdsOf(list.products)).toEqual(productIdsOf(products));
    });

    test("deleteList", async () => {
      const name = "test delete list";
      const { listId } = await listService.createList(name);
      expect(await listService.getList(listId)).toBeTruthy();
      const response = await listService.deleteList(listId);
      expect(response.ok).toBe(true);
      expect(() => listService.getList(listId)).rejects.toThrowError(/404/);
    });

    test.only("addProductsToList", async () => {
      const name = "test add products to list";
      const { listId } = await listService.createList(name);
      expect(await listService.getList(listId)).toBeTruthy();
      await listService.updateList({ listId, products: [refs.milk] });

      const itemsToAdd = refs.manyItems;
      const updated = await listService.addProductsToList(listId, itemsToAdd);
      expect(updated.products.length).toBe(itemsToAdd.length + 1);
    });
  });

  // describe("snapshot tests", () => {});
});
