import jwt from "jsonwebtoken";
import { query } from "../config/database.js";

export async function authenticate(req, res, next) {
  const authorization = req.headers.authorization || "";

  if (!authorization.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Please log in to access this resource."
    });
  }

  const token = authorization.slice(7);

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({
      error: "Invalid or expired login session."
    });
  }

  try {
    const result = await query(
      `SELECT id, name, email, role, active, approval_status
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [decoded.id]
    );

    const user = result.rows[0];

    if (
      !user ||
      !user.active ||
      user.approval_status !== "approved"
    ) {
      return res.status(401).json({
        error: "Your account is inactive or not approved. Please sign in again."
      });
    }

    // Use the current database role, not an old role stored in the token.
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    return next();

  } catch (error) {
    return next(error);
  }
}