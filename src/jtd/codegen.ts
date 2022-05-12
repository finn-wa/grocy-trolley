import { JTDSchemaType } from "ajv/dist/core";
import { execFile } from "child_process";
import { existsSync } from "fs";
import { Readable } from "stream";

/**
 * Generates typescript type definitions based on JTD schema
 * @rootName
 * @param schema Schema
 * @param outputDir Output directory for generated typescript files
 * @see https://jsontypedef.com/docs/jtd-codegen
 * @see https://github.com/jsontypedef/json-typedef-codegen
 */
export async function jtdCodegen(
  rootName: string,
  schema: JTDSchemaType<unknown>,
  outputDir: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const jtdCodegenPath = process.platform === "win32" ? "bin/jtd-codegen.exe" : "bin/jtd-codegen";
    if (!existsSync(jtdCodegenPath)) {
      return reject(
        new Error(
          `${jtdCodegenPath} not found, please download from https://github.com/jsontypedef/json-typedef-codegen/releases`
        )
      );
    }
    const jtdCodegen = execFile(
      jtdCodegenPath,
      ["--root-name", rootName, "--typescript-out", outputDir, "-"],
      (error, stdout) => {
        if (error) reject(error);
        if (stdout) console.log(stdout);
      }
    );
    jtdCodegen.on("close", () => resolve());
    if (!jtdCodegen.stdin) {
      throw new Error(`[jtd-codegen] io error. stdin not initialised`);
    }
    const input = JSON.stringify(schema);
    const inputStream = new Readable();
    inputStream.pipe(jtdCodegen.stdin);
    inputStream.push(input);
    inputStream.push(null);
  });
}
