import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    setupFiles: ["tests/unit/setup.ts"],
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: "v8",
      include: ["src/features/transcription/**/*.{ts,tsx}"],
      exclude: ["src/features/transcription/**/*.d.ts"],
      reporter: ["text", "html", "json-summary"],
      thresholds: {
        perFile: true,
        lines: 90,
        functions: 90,
        branches: 80,
      },
    },
  },
});
