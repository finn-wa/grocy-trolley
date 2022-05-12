import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { jtdCodegen } from "./codegen";
import { jtdInfer } from "./infer";

function writeJsonFile(path: string, obj: any) {
  return writeFile(path, JSON.stringify(obj), { encoding: "utf-8" });
}

export async function generateTypes(
  methodName: string,
  typeName: string,
  sourceDir: string,
  ...inputs: any[]
) {
  const typesDir = path.join(sourceDir, "types", methodName);
  await mkdir(typesDir, { recursive: true });
  // Save raw JSON files as samples
  await writeJsonFile(path.join(typesDir, "samples.json"), inputs);
  // Infer JTD and save as schema
  const inferred = await jtdInfer<unknown>(...inputs);
  await writeJsonFile(path.join(typesDir, "schema.json"), inferred);
  // Generate code and save as index.ts
  await jtdCodegen(typeName, inferred, typesDir);
}
