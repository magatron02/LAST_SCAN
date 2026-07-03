/// <reference types="vitest/config" />
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "three/addons": "three/examples/jsm",
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*_test.js", "tests/integration/**/*_test.js"],
  },
});
