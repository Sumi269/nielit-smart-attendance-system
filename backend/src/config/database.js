
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

// Use the pooled connection for normal application queries.
const connectionString =
  process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL;

export const databaseConfigured = Boolean(
  connectionString &&
  !connectionString.includes("YOUR_") &&
  !connectionString.includes("YOUR_PASSWORD")
);

export const pool = databaseConfigured
  ? new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    })
  : null;

if (pool) {
  pool.on("error", (error) => {
    console.error("Unexpected PostgreSQL error:", error.message);
  });
}

export async function query(sql, params = []) {
  if (!pool) {
    const error = new Error(
      "Database is not configured. Check backend/.env."
    );
    error.status = 503;
    throw error;
  }

  return pool.query(sql, params);
}

export async function checkDatabase() {
  if (!pool) {
    return {
      configured: false,
      connected: false
    };
  }

  await pool.query("SELECT 1");

  return {
    configured: true,
    connected: true
  };
}
