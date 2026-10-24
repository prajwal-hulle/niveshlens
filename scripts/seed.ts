import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../lib/db/schema";
import { seedDatabase } from "../lib/db/seed-data";

async function main() {
  const databaseUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING;

  if (!databaseUrl || databaseUrl.trim() === "") {
    console.log("No DATABASE_URL provided. Skipping remote DB seed.");
    return;
  }

  console.log("Connecting to Neon Postgres...");
  const sql = neon(databaseUrl);
  const db = drizzle(sql, { schema });

  console.log("Running idempotent upsert seed...");
  await seedDatabase(db);
  console.log("Database successfully seeded with verified Indian financial datasets!");
}

main().catch((err) => {
  console.error("Seeding warning:", err);
  process.exit(1);
});
