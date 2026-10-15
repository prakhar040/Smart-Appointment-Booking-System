/* eslint @typescript-eslint/no-require-imports: "off" */
const { spawnSync } = require("node:child_process");

// Prisma's schema requires both URLs to be present even though generation
// never connects to the database. Supply local-only defaults for fresh clones
// that have not created .env yet; real values in the environment take priority.
process.env.DATABASE_URL ||= "postgresql://postgres:postgres@localhost:5432/appointments";
process.env.DIRECT_URL ||= process.env.DATABASE_URL;

const prismaCli = require.resolve("prisma/build/index.js");
const result = spawnSync(process.execPath, [prismaCli, "generate"], {
  cwd: process.cwd(),
  env: process.env,
  stdio: "inherit",
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
