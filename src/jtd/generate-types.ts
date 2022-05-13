import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { jtdCodegen } from "./codegen";
import { jtdInfer } from "./infer";

function writeJsonFile(path: string, obj: unknown) {
  return writeFile(path, JSON.stringify(obj), { encoding: "utf-8" });
}

function generateTypecheckFile(type: string, jtd: string): string {
  return `
/**
 * This file is for confirming that the TypeScript types and the schema
 * stay in sync, allowing the types to be safely modified.
 */

import { JTDDataType } from "ajv/dist/core";
import { ${type} } from ".";

/* eslint-disable */
type JTD${type} = JTDDataType<${jtd}>;
type DoesExtend<X, Y extends X> = Y;
type _CustomExtendsJTD = DoesExtend<JTD${type}, ${type}>;
type _JTDExtendsCustom = DoesExtend<${type}, JTD${type}>;
/* eslint-enable */
`;
}

export async function generateTypes(
  methodName: string,
  typeName: string,
  sourceDir: string,
  ...inputs: unknown[]
) {
  const typesDir = join(sourceDir, "types", methodName);
  await mkdir(typesDir, { recursive: true });
  // Save raw JSON files as samples
  await writeJsonFile(join(typesDir, "samples.json"), inputs);
  // Infer JTD and save as schema
  const inferred = await jtdInfer<unknown>(...inputs);
  await writeJsonFile(join(typesDir, "schema.json"), inferred);
  // Generate code and save as index.ts
  await jtdCodegen(typeName, inferred, typesDir);
  // Write typecheck file
  await writeFile(join(typesDir, "typecheck.ts"), generateTypecheckFile(typeName, inferred));
}
