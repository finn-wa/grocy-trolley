import "@abraham/reflection";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { configDefaults } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths({ projects: ["tsconfig.json"] })],
  test: {
    api: { host: "0.0.0.0", strictPort: true },
    setupFiles: ["src/test/setup.ts"],
    exclude: [...configDefaults.exclude, "build"],
    coverage: {
      provider: "c8",
      reportsDirectory: "build/test-reports",
      reporter: ["html", "text-summary"],
    },
  },
});
