import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { checkDatabase } from "./config/database.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import { calculateAttendance } from "./utils/attendanceCalculator.js";

import authRoutes from "./modules/auth/routes.js";
import studentRoutes from "./modules/students/student.routes.js";
import courseRoutes from "./modules/courses/routes.js";
import batchRoutes from "./modules/batches/routes.js";
import attendanceRoutes from "./modules/attendance/routes.js";
import importRoutes from "./modules/imports/routes.js";
import reconciliationRoutes from "./modules/reconciliation/routes.js";
import reportRoutes from "./modules/reports/routes.js";
import deviceRoutes from "./modules/devices/routes.js";

const app = express();

app.disable("x-powered-by");

app.use(helmet());

app.use(
  cors({
    origin: (
      process.env.FRONTEND_ORIGIN || "http://localhost:5173"
    )
      .split(",")
      .map((origin) => origin.trim())
  })
);

app.use(express.json({ limit: "1mb" }));

app.use(
  "/api/auth/login",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false
  })
);

app.get("/", (req, res) => {
  res.json({
    name: "NIELIT Smart Attendance API",
    version: "1.0.0",
    status: "running"
  });
});

app.get("/api/health", async (req, res) => {
  try {
    const database = await checkDatabase();

    res.json({
      status: database.connected ? "ok" : "database_not_configured",
      api: "running",
      database
    });
  } catch {
    res.status(503).json({
      status: "degraded",
      api: "running",
      database: {
        configured: true,
        connected: false
      },
      message: "Check your PostgreSQL connection."
    });
  }
});

app.post("/api/tools/calculate-attendance", (req, res, next) => {
  try {
    const result = calculateAttendance(req.body);
    res.json(result);
  } catch (error) {
    error.status = 400;
    next(error);
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/imports", importRoutes);
app.use("/api/reconciliation", reconciliationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/devices", deviceRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;