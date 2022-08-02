const { program, Option } = require("commander");
const esbuild = require("esbuild");
const fs = require("fs/promises");

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
    minify: args.target === "prod",
    outdir: "build/out",
    platform: "node",
    plugins: [],
    sourcemap: args.sourcemap ? "inline" : false,
    tsconfig: "./tsconfig.json",
    watch: args.watch,
    entryPoints: ["./src/main.ts"],
    external: ["playwright*"],
    metafile: args.analyse,
  };
  return buildOptions;
}

/**
 * Runs esbuild.
 *
 * @param {esbuild.BuildOptions} options
 * @returns {Promise<esbuild.BuildResult>}
 */
async function build(options) {
  await fs.rm(options.outdir, { recursive: true, force: true });
  const result = await esbuild.build(options);
  if (options.metafile) {
    console.log(await esbuild.analyzeMetafile(result.metafile));
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
  .parse();

const buildOptions = getBuildOptions(program.opts());
build(buildOptions).catch(() => process.exit(1));
