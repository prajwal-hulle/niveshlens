import { execSync } from "child_process";

const dbUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING;

if (!dbUrl || dbUrl.trim() === "") {
  console.log("No DATABASE_URL, using static seed");
  process.exit(0);
}

console.log("DATABASE_URL detected. Starting automated schema push and seed...");

try {
  const env = {
    ...process.env,
    DATABASE_URL: dbUrl,
  };

  // Run idempotent drizzle schema push
  console.log("Pushing Drizzle ORM schema to Neon Postgres...");
  execSync("npx drizzle-kit push", {
    stdio: "inherit",
    env,
  });

  // Run idempotent upsert seed
  console.log("Executing seed script with natural key upsert...");
  execSync("npx tsx scripts/seed.ts", {
    stdio: "inherit",
    env,
  });

  console.log("Automated DB setup completed successfully.");
} catch (err) {
  // A failure here must warn and continue, never break the build
  console.warn("Automated DB setup encountered an issue (continuing build with static fallback):", err?.message || err);
}

process.exit(0);
