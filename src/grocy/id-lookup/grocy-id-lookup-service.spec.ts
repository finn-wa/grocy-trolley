import { GrocyIdLookupService } from "./grocy-id-lookup-service";

class TestLookupService<K extends string> extends GrocyIdLookupService<K> {
  constructor(readonly mapOfKeysToGrocyIds: Record<K, string>) {
    super();
  }

  protected fetchMapOfKeysToGrocyIds(): Promise<Record<string, string>> {
    return Promise.resolve(this.mapOfKeysToGrocyIds);
  }
}

describe("GrocyIdLookupService", () => {
  const mapOfKeysToGrocyIds = { key1: "id1", key2: "id2" };
  let lookupService: TestLookupService<keyof typeof mapOfKeysToGrocyIds>;

  beforeEach(() => {
    lookupService = new TestLookupService(mapOfKeysToGrocyIds);
  });

  test("getMapOfKeysToGrocyIds", async () => {
    const keysToGrocyIds = await lookupService.getMapOfKeysToGrocyIds();
    expect(keysToGrocyIds).toEqual(mapOfKeysToGrocyIds);
  });

  test("getMapOfGrocyIdsToKeys", async () => {
    const grocyIdsToKeys = await lookupService.getMapOfGrocyIdsToKeys();
    expect(grocyIdsToKeys).toEqual({ id1: "key1", id2: "key2" });
  });

  test("getGrocyId should get the grocy ID for a key", async () => {
    const grocyId = await lookupService.getGrocyId("key1");
    expect(grocyId).toEqual("id1");
  });

  test("getRequiredGrocyId should get the grocy ID for a key", async () => {
    const grocyId = await lookupService.getRequiredGrocyId("key1");
    expect(grocyId).toEqual("id1");
  });

  test("getRequiredGrocyId should throw an error if the grocy ID is missing", async () => {
    await expect(lookupService.getRequiredGrocyId("key3" as "key1")).rejects.toThrowError(
      "Missing grocy ID for key 'key3'"
    );
  });

  test("getKey should get the key for a grocy id", async () => {
    const key = await lookupService.getKey("id1");
    expect(key).toEqual("key1");
  });

  test("getRequiredKey should get the key for a grocy id", async () => {
    const key = await lookupService.getRequiredKey("id1");
    expect(key).toEqual("key1");
  });

  test("getRequiredKey should throw an error if the key is missing", async () => {
    await expect(lookupService.getRequiredKey("id3")).rejects.toThrowError(
      "Missing key for grocy ID 'id3'"
    );
  });
});
