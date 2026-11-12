import dotenv from "dotenv";

dotenv.config();

import app from "./app.js";
import { pool } from "./config/database.js";
import { validateEnvironment } from "./config/env.js";

validateEnvironment();

const PORT = Number(process.env.PORT || 5000);

const server = app.listen(PORT, () => {
  console.log(`NIELIT Smart Attendance API: http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

async function shutdown() {
  console.log("Shutting down server...");

  server.close(async () => {
    if (pool) {
      await pool.end();
    }

    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);