import { ValidateFunction } from "ajv";
import { test } from "vitest";
import { throwIfInvalid } from "./ajv";

export function expectSchemaToValidate<T>(validator: ValidateFunction<T>, data: T) {
  throwIfInvalid(validator, data);
}

export function testSchemaWithSamples<T>(validator: ValidateFunction<T>, samples: T[]) {
  samples.forEach((sample, i) => {
    test(`should validate sample ${i}`, () => expectSchemaToValidate(validator, sample));
  });
}
