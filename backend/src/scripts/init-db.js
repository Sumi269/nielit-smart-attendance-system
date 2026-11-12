import dotenv from "dotenv";
dotenv.config();

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Pool } = pg;
const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

async function initializeDatabase() {
  const connectionString = process.env.DATABASE_URL;

  if (
    !connectionString ||
    connectionString.includes("YOUR_") ||
    connectionString.includes("YOUR_PASSWORD")
  ) {
    throw new Error(
      "Set your direct Neon connection string in backend/.env"
    );
  }

  const migrationPool = new Pool({
    connectionString,
    max: 1
  });

  let client;

  try {
    client = await migrationPool.connect();

    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const migrationsDirectory = path.resolve(
      currentDirectory,
      "../../migrations"
    );

    const files = (await fs.readdir(migrationsDirectory))
      .filter((file) => /^\d+_.*\.sql$/.test(file))
      .sort();

    for (const filename of files) {
      const existing = await client.query(
        "SELECT filename FROM schema_migrations WHERE filename = $1",
        [filename]
      );

      if (existing.rowCount > 0) {
        console.log(`Skipped ${filename} (already applied).`);
        continue;
      }

      const sql = await fs.readFile(
        path.join(migrationsDirectory, filename),
        "utf8"
      );

      await client.query("BEGIN");

      try {
        await client.query(sql);

        await client.query(
          "INSERT INTO schema_migrations (filename) VALUES ($1)",
          [filename]
        );

        await client.query("COMMIT");

        console.log(`Applied ${filename}.`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }

    console.log("Database migrations completed successfully.");
  } finally {
    client?.release();
    await migrationPool.end();
  }
}

initializeDatabase().catch((error) => {
  console.error("Database migration failed:", error.message);
  process.exitCode = 1;
});