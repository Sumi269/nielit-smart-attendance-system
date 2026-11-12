import dotenv from "dotenv";

dotenv.config();

export function validateEnvironment() {
  const missing = [];

  if (!process.env.JWT_SECRET) {
    missing.push("JWT_SECRET");
  }

  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters.");
  }

  if (missing.length) {
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }
}