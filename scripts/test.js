/*
 * This is designed to be called from build.js as a child process, as the
 * TypeScript needs to be transpiled before the tests run.
 */
const Jasmine = require("jasmine");
const { SpecReporter } = require("jasmine-spec-reporter");

console.log("[test] tests started");
const jasmine = new Jasmine();
jasmine.loadConfig({
  spec_dir: "out",
  spec_files: ["**/*.spec.js"],
  failSpecWithNoExpectations: true,
});
jasmine.clearReporters();
jasmine.addReporter(
  new SpecReporter({
    spec: { displayPending: true },
  })
);
jasmine.exitOnCompletion = false;
jasmine.execute().then((passed) => {
  console.log("[test] tests finished");
  process.exit(passed ? 0 : 1);
});
