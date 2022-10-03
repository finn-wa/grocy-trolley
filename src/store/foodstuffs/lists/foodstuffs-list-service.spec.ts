import { beforeAll, beforeEach, describe, expect, test } from "vitest";
import { beforeAllFoodstuffsTests, foodstuffsTestContainer } from "../test/foodstuffs-test-utils";
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

describe("[external] FoodstuffsListService", () => {
  let listService: FoodstuffsListService;
  const refs = new ProductRefs();

  const productIdsOf = (products: { productId: string }[]) =>
    products.map((p) => p.productId).sort();
  const expectArrayOfLength = (arr: ArrayLike<unknown>, length: number) =>
    expect(arr).toMatchObject<ArrayLike<unknown>>({ length });

  beforeAll(() => beforeAllFoodstuffsTests());

  beforeEach(async () => {
    listService = foodstuffsTestContainer().resolve(FoodstuffsListService);
    await listService.deleteLists(/^(?!My Favourites)/);
  });

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
