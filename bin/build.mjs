import { program, Option } from "commander";
import esbuild from "esbuild";
import { rm, writeFile } from "fs/promises";
import { esbuildDecorators } from "@anatine/esbuild-decorators";
import { join } from "path";

/**
 * Produces build options from CLI args.
 *
 * @param {ProgramArgs} args
 * @returns {esbuild.BuildOptions}
 */
function getBuildOptions(args) {
  /** @type {esbuild.BuildOptions} */
  const buildOptions = {
    bundle: true,
    format: "cjs",
    logLevel: "info",
    minify: args.minify,
    outdir: "build/out",
    platform: "node",
    plugins: [],
    sourcemap: args.sourcemap ? "inline" : false,
    watch: args.watch,
    entryPoints: ["./src/main.ts"],
    external: ["playwright*"],
    metafile: args.analyse,
    plugins: [esbuildDecorators()],
  };
  return buildOptions;
}

/**
 * Runs esbuild.
 *
 * @param {esbuild.BuildOptions} options
 * @returns {Promise<esbuild.BuildResult>}
 */
async function runEsbuild(options) {
  await rm(options.outdir, { recursive: true, force: true });
  const result = await esbuild.build(options);
  if (options.metafile) {
    console.log(await esbuild.analyzeMetafile(result.metafile));
    await writeFile(join(options.outdir, "metafile.json"), JSON.stringify(result.metafile));
  }
  return result;
}

/**
 * CLI arguments passed to this program
 * @typedef ProgramArgs
 * @property { 'dev' | 'test' | 'prod'} target build target
 * @property {boolean} watch rebuild on file change
 * @property {boolean} sourcemap produce sourcemaps for debugging
 * @property {boolean} analyse print bundle analysis
 * @property {boolean} minify minify code
 */
program
  .addOption(
    new Option("-t, --target <target>", "build target")
      .choices(["dev", "test", "prod"])
      .makeOptionMandatory()
  )
  .option("-w, --watch", "rebuild on file changes", false)
  .option("-s, --sourcemap", "produce sourcemaps for debugging", false)
  .option("-a, --analyse", "print bundle analysis", false)
  .option("-m, --minify", "minify code", false)
  .parse();

const buildOptions = getBuildOptions(program.opts());
runEsbuild(buildOptions).then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
