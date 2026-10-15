import path from "node:path";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const dev = loadEnv("development", process.cwd(), "");

  if (!env.DATABASE_URL || env.DATABASE_URL === dev.DATABASE_URL) {
    throw new Error(
      "Tests must use a separate database. Set DATABASE_URL in .env.test to the Neon test branch.",
    );
  }

  return {
    resolve: { alias: { "@": path.resolve(process.cwd(), "src") } },
    test: {
      environment: "node",
      env: { DATABASE_URL: env.DATABASE_URL, DIRECT_URL: env.DIRECT_URL },
      fileParallelism: false,
      testTimeout: 30_000,
      hookTimeout: 30_000,
    },
  };
});
