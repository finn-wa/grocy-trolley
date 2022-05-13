import { execFile } from "child_process";
import { existsSync } from "fs";
import { Readable } from "stream";

/**
 * Infers a Json Type Definition from sample JS objects.
 * @param inputObjects Sample objects to infer
 * @returns string containing the JTD
 * @see https://jsontypedef.com/docs/jtd-infer
 * @see https://github.com/jsontypedef/json-typedef-infer
 */
export async function jtdInfer<T>(...inputObjects: T[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const jtdInferPath = process.platform === "win32" ? "bin/jtd-infer.exe" : "bin/jtd-infer";
    if (!existsSync(jtdInferPath)) {
      return reject(
        new Error(
          `${jtdInferPath} not found, please download from https://github.com/jsontypedef/json-typedef-infer/releases`
        )
      );
    }
    const jtdInfer = execFile(jtdInferPath, (error, stdout) => {
      if (error) reject(error);
      if (stdout) resolve(stdout);
    });
    if (!jtdInfer.stdin || !jtdInfer.stdout) {
      throw new Error(
        `[jtd-infer] io error. stdin initialised: ${!!jtdInfer.stdin}, stdout initialised: ${!!jtdInfer.stdout}`
      );
    }
    const input = inputObjects.map((obj) => JSON.stringify(obj)).join("\n");
    const inputStream = new Readable();
    inputStream.pipe(jtdInfer.stdin);
    inputStream.push(input);
    inputStream.push(null);
  });
}
