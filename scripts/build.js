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
    // Things require()d by Playwright
    external: ["electron/index.js", "ws", "./appIcon.png", "pixelmatch"],
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
  return esbuild.build(options);
}

/**
 * CLI arguments passed to this program
 * @typedef ProgramArgs
 * @property { 'dev' | 'test' | 'prod'} target build target
 * @property {boolean} watch rebuild on file change
 * @property {boolean} sourcemap produce sourcemaps for debugging
 */
program
  .addOption(
    new Option("-t, --target <target>", "build target")
      .choices(["dev", "test", "prod"])
      .makeOptionMandatory()
  )
  .option("-w, --watch", "rebuild on file changes", false)
  .option("-s, --sourcemap", "produce sourcemaps for debugging", false)
  .parse();

const buildOptions = getBuildOptions(program.opts());
build(buildOptions).catch(() => process.exit(1));
