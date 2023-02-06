import { map, OperatorFunction } from "rxjs";

/* eslint-disable */

export function pluck<T, R>(...properties: string[]): OperatorFunction<T, R> {
  return map((state) => {
    if (properties.length === 0) {
      return state;
    }
    let currentValue: any = state;
    for (const prop of properties) {
      const nextValue = currentValue?.[prop];
      if (typeof nextValue !== "undefined") {
        currentValue = nextValue;
      } else {
        return undefined;
      }
    }
    return currentValue;
  });
}
