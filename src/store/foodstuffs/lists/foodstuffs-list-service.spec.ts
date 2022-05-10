import { LoginDetails } from "@gt/store/shared/rest/login-details.model";
import { getEnvAs, initEnv } from "@gt/utils/environment";
import { FoodstuffsUserAgent } from "../rest/foodstuffs-user-agent";
import { getBrowser } from "../services";
import { FoodstuffsListService } from "./foodstuffs-list-service";
import { List, ListProductRef } from "./foodstuffs-list.model";

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

  initEnv({
    envFilePath: ".test.env",
    envFilePathOptional: true,
    requiredVars: ["PAKNSAVE_EMAIL", "PAKNSAVE_PASSWORD"],
  });
  const loginDetails: LoginDetails = getEnvAs({
    PAKNSAVE_EMAIL: "email",
    PAKNSAVE_PASSWORD: "password",
  });
  const productIdsOf = (products: { productId: string }[]) =>
    products.map((p) => p.productId).sort();
  const expectArrayOfLength = (arr: ArrayLike<unknown>, length: number) =>
    expect(arr).toMatchObject<ArrayLike<unknown>>({ length });

  beforeEach(async () => {
    const userAgent = new FoodstuffsUserAgent(getBrowser, loginDetails);
    listService = new FoodstuffsListService(userAgent);
    await listService.deleteLists(/^(?!My Favourites)/);
  });

  describe("unit tests", () => {
    test("getLists", async () => {
      const lists = await listService.getLists();
      expectArrayOfLength(lists, 1);
      expect(lists[0]).toMatchObject({ name: "My Favourites", products: [] });
    });

    test("createList", async () => {
      const name = "strawberry";
      const list = await listService.createList(name);
      expect(list.name).toEqual(name);
      expect(list.products).toEqual([]);
      expect(list.listId).toBeTruthy();
    });

    test("createListWithProducts", async () => {
      const name = "raspberry";
      const products = refs.manyItems;
      const list = await listService.createListWithProducts(name, products);
      expect(list.listId).toBeTruthy();
      expect(productIdsOf(list.products)).toEqual(productIdsOf(products));
    });

    test("updateList", async () => {
      const name = "lemon";
      const { listId } = await listService.createList(name);
      const products = [refs.bread, refs.carrots];
      const list = await listService.updateList({ listId, products });
      expect(list.listId).toEqual(listId);
      expect(productIdsOf(list.products)).toEqual(productIdsOf(products));
    });

    test("deleteList", async () => {
      const name = "lime";
      const { listId } = await listService.createList(name);
      expect(await listService.getList(listId)).toBeTruthy();
      const response = await listService.deleteList(listId);
      expectArrayOfLength(response.lists, 1);
      expect(() => listService.getList(listId)).rejects.toThrowError(/404/);
    });

    test("deleteLists", async () => {
      for (const name of ["temporary list", "important items", "apr 1st (TEMP)"]) {
        await listService.createList(name);
      }
      const listsBefore = await listService.getLists();
      expectArrayOfLength(listsBefore, 4);
      const importantList = listsBefore.find((product) => product.name.includes("important"));
      expect(importantList).toBeTruthy();

      await listService.deleteLists(/temp/gi);
      const listsAfter = await listService.getLists();
      expectArrayOfLength(listsAfter, 2);
      expect(listsAfter).toContainEqual(importantList);
    });

    test("addProductsToList", async () => {
      const name = "persimmon";
      const { listId } = await listService.createList(name);
      expect(await listService.getList(listId)).toBeTruthy();
      await listService.updateList({ listId, products: [refs.milk] });

      const itemsToAdd = refs.manyItems;
      const updated = await listService.addProductsToList(listId, itemsToAdd);
      expectArrayOfLength(updated.products, itemsToAdd.length + 1);
    });
  });

  describe("snapshot tests", () => {
    function formatListForSnapshot(list: List): Partial<List> {
      return {
        ...list,
        listId: list.listId ? "uuid" : undefined,
        products: list.products?.map((product) => ({ ...product, price: 0 })),
      };
    }

    test("createList", async () => {
      const list = await listService.createList("orange");
      expect(formatListForSnapshot(list)).toMatchSnapshot();
    });

    test("getLists", async () => {
      const lists = await listService.getLists();
      expect(lists.map(formatListForSnapshot)).toMatchSnapshot();
    });

    test("getList", async () => {
      const { listId } = await listService.createListWithProducts("blueberry", [
        refs.bread,
        refs.carrots,
      ]);
      const list = await listService.getList(listId);
      expect(formatListForSnapshot(list)).toMatchSnapshot();
    });

    test("updateList", async () => {
      const { listId } = await listService.createListWithProducts("breadfruit", [refs.bread]);
      const list = await listService.updateList({ listId, products: [refs.carrots, refs.milk] });
      expect(formatListForSnapshot(list as List)).toMatchSnapshot();
    });

    test("deleteList", async () => {
      await listService.createListWithProducts("broccoli", [refs.milk]);
      const { listId } = await listService.createListWithProducts("tomato", [refs.bread]);
      const response = await listService.deleteList(listId);
      expect({
        ...response,
        lists: (response.lists as List[])?.map(formatListForSnapshot),
      }).toMatchSnapshot();
    });
  });
});
