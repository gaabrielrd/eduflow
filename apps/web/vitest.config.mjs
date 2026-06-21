import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react"
  },
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "src"),
      "@eduflow/ui": path.resolve(rootDir, "../../packages/ui/src/index.ts"),
      "@hookform/resolvers/zod": path.resolve(
        rootDir,
        "node_modules/@hookform/resolvers/zod"
      ),
      "@testing-library/react": path.resolve(
        rootDir,
        "node_modules/@testing-library/react"
      ),
      react: path.resolve(rootDir, "node_modules/react"),
      "react-dom": path.resolve(rootDir, "node_modules/react-dom"),
      "react-hook-form": path.resolve(rootDir, "node_modules/react-hook-form"),
      zod: path.resolve(rootDir, "node_modules/zod")
    }
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"]
  }
});
