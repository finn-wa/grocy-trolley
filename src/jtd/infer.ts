import { Logger } from "@gt/utils/logger";
import { JTDSchemaType } from "ajv/dist/jtd";
import { execFileSync } from "child_process";
import { existsSync } from "fs";

interface JTDRecordSchemaType {
  elements?: Partial<JTDRecordSchemaType>;
  properties: Record<string, Partial<JTDRecordSchemaType>>;
  optionalProperties?: Record<string, Partial<JTDRecordSchemaType>>;
  metadata?: { typescriptType: string };
}

/**
 * AJV offers {@link JTDSchemaType} for using TypeScript to check whether a TS
 * type is equivalent to the JSON Type Definition, but it's a bit fussy at times.
 * This function mutates the object, moving `any`/`{}` types from properties to
 * optionalProperties.
 * There may still be issues present in the generated schema, see {@link Unknown}.
 * @param schema Schema generated by jtd-infer
 * @returns JTD schema compatible with JTDSchemaType
 */
function moveAnyTypePropertiesToOptional<T extends Partial<JTDRecordSchemaType>>(schema: T): void {
  const logger = new Logger("InferTypes");
  if (schema.elements) {
    moveAnyTypePropertiesToOptional(schema.elements);
  }
  if (schema.properties) {
    const toShift = Object.entries(schema.properties).filter(
      (
        [_key, obj] // obj is {}
      ) => !!obj && Object.keys(obj).length === 0 && Object.getPrototypeOf(obj) === Object.prototype
    );
    if (toShift.length > 0) {
      logger.debug("shifting: ", toShift);
      if (!schema.optionalProperties) {
        schema.optionalProperties = {};
      }
      for (const [key] of toShift) {
        delete schema.properties[key];
        schema.optionalProperties[key] = { metadata: { typescriptType: "unknown" } };
      }
    }
    if (Object.keys(schema.properties).length === 0) {
      delete schema.properties;
    } else {
      for (const obj of Object.values(schema.properties)) {
        moveAnyTypePropertiesToOptional(obj);
      }
    }
  }
}

/**
 * Infers a Json Type Definition from sample JS objects.
 * @param inputObjects Sample objects to infer
 * @returns string containing the JTD
 * @see https://jsontypedef.com/docs/jtd-infer
 * @see https://github.com/jsontypedef/json-typedef-infer
 */
export function jtdInfer<T>(...inputObjects: T[]): JTDSchemaType<T> {
  const jtdInferPath = process.platform === "win32" ? "bin/jtd-infer.exe" : "bin/jtd-infer";
  if (!existsSync(jtdInferPath)) {
    throw new Error(
      `${jtdInferPath} not found, please download from https://github.com/jsontypedef/json-typedef-infer/releases`
    );
  }
  const input = inputObjects.map((obj) => JSON.stringify(obj)).join("\n");
  const jtd = execFileSync(jtdInferPath, { input, encoding: "utf-8" });
  const jtdObj = JSON.parse(jtd) as Partial<JTDRecordSchemaType>;
  moveAnyTypePropertiesToOptional(jtdObj);
  return jtdObj as JTDSchemaType<T>;
}

/**
 * JTDSchemaType is restricted to concrete types, and cannot validate type
 * `unknown`, `null`, or `any[]`. This is a placeholder type to use as a
 * workaround on the Typescript side.
 * @see https://github.com/ajv-validator/ajv/issues/1877
 * @see {@link UNKNOWN}
 */
export type Unknown = "?";

/**
 * JTDSchemaType is restricted to concrete types, and cannot validate type
 * `unknown`, `null`, or `any[]`. This is a placeholder value to use as a
 * workaround on the JTD schema side.
 * @see https://github.com/ajv-validator/ajv/issues/1877
 * @see {@link Unknown}
 */
export const UNKNOWN: JTDSchemaType<Unknown> = { enum: ["?"] };
