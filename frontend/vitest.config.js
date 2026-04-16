import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.js"],
    globals: true,
    include: ["tests/**/*.test.{js,jsx}"],
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});
