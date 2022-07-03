import { withBooleans, withNumbers, withOptionalIds } from "./grocy-types";

describe("GrocyTypes", () => {
  test("withBooleans", () => {
    const obj = {
      a: "1",
      b: "0",
      c: "",
      d: 7,
    };
    const result = withBooleans(obj, ["a", "b"]);
    expect(result).toEqual({
      a: true,
      b: false,
      c: "",
      d: 7,
    });
  });

  test("withNumbers", () => {
    const obj = {
      a: "0",
      b: "1",
      c: undefined,
      d: "7",
      e: null,
      f: "",
    };
    const result = withNumbers(obj, ["a", "d", "e", "f"]);
    expect(result).toEqual({
      a: 0,
      b: "1",
      c: undefined,
      d: 7,
      e: null,
      f: null,
    });
  });

  test("withOptionalIds", () => {
    const obj = { a: "", b: "7", c: 3 };
    const result = withOptionalIds(obj, ["a", "b"]);
    expect(result).toEqual({ a: null, b: "7", c: 3 });
  });
});
