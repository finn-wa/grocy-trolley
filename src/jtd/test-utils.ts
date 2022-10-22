import { prettyPrint } from "@gt/utils/logger";
import { ValidateFunction } from "ajv";
import { test } from "vitest";
import { validationErrorMsg } from "./ajv";
import { jtdInfer } from "./infer";

export function expectSchemaToValidate<T>(validator: ValidateFunction<T>, data: T) {
  if (validator(data)) {
    return;
  }
  const dataSchema = jtdInfer(data);
  console.log(`generated schema:\n${prettyPrint(dataSchema)}`);
  throw new Error(validationErrorMsg(validator, data));
}

export function testSchemaWithSamples<T>(validator: ValidateFunction<T>, samples: T[]) {
  samples.forEach((sample, i) => {
    test(`should validate sample ${i}`, () => expectSchemaToValidate(validator, sample));
  });
}
