const { program, Option } = require("commander");
const { fork, ChildProcess } = require("child_process");
const esbuild = require("esbuild");
const glob = require("fast-glob");
const fs = require("fs/promises");

/** @type {ChildProcess} */
let jasmineProcess = null;

/**
 * Runs jasmine tests.
 *
 * @param {esbuild.BuildResult} result
 */
function runTestProcess(result) {
  if (result?.errors?.length > 0) {
    console.log("[test] skipping tests");
    return;
  }
  jasmineProcess = fork(__dirname + "/test");
  jasmineProcess.on("exit", () => (jasmineProcess = null));
}

/**
 * Kills the child process running the tests.
 */
function killTestProcess() {
  if (jasmineProcess) {
    console.log("[test] cancelling tests");
    jasmineProcess.kill("SIGTERM");
  }
}

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
    outdir: "out",
    platform: "node",
    plugins: [],
    sourcemap: args.sourcemap ? "inline" : false,
    tsconfig: "./tsconfig.json",
    watch: args.watch,
    // Things require()d by Playwright
    external: ["electron/index.js", "ws", "./appIcon.png"],
  };

  if (args.target === "test") {
    buildOptions.entryPoints = glob.sync("./src/**/*.ts");
    buildOptions.plugins.push({
      name: "JasmineRunner",
      setup: (build) => {
        build.onStart(() => killTestProcess());
        build.onEnd((res) => runTestProcess(res));
      },
    });
  } else {
    buildOptions.entryPoints = ["./src/main.ts"];
    buildOptions.watch = args.watch;
  }
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
