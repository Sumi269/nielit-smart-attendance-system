import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { timingSafeEqual } from "node:crypto";

import { query } from "../../config/database.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validateRequired } from "../../middleware/validate.js";
import { writeAuditLog } from "../../utils/audit.js";

const router = Router();

function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      name: user.name
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "8h",
      issuer: "nielit-smart-attendance"
    }
  );
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many attempts. Try again after 15 minutes."
  }
});

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validStaffPassword(password) {
  return (
    password.length >= 12 &&
    Buffer.byteLength(password, "utf8") <= 72
  );
}

function validStrongPassword(password) {
  return (
    password.length >= 16 &&
    Buffer.byteLength(password, "utf8") <= 72 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active,
    approval_status: user.approval_status
  };
}

function isDuplicateEmail(error) {
  return (
    error?.code === "23505" &&
    String(error.constraint || "").toLowerCase().includes("email")
  );
}

/* =====================================================
   1. FIRST-TIME SYSTEM OWNER SETUP
   ===================================================== */

router.post(
  "/setup-owner",
  authLimiter,
  validateRequired("name", "email", "password", "setupKey"),
  async (req, res, next) => {
    try {
      const expected = Buffer.from(
        process.env.ADMIN_SETUP_KEY || "",
        "utf8"
      );

      const supplied = Buffer.from(
        String(req.body.setupKey),
        "utf8"
      );

      if (
        expected.length < 32 ||
        supplied.length !== expected.length ||
        !timingSafeEqual(expected, supplied)
      ) {
        return res.status(403).json({
          error: "Invalid setup key."
        });
      }

      const name = String(req.body.name).trim();
      const email = String(req.body.email).trim().toLowerCase();
      const password = String(req.body.password);

      if (name.length < 2 || name.length > 100) {
        return res.status(400).json({
          error: "Enter a valid name."
        });
      }

      if (!validEmail(email)) {
        return res.status(400).json({
          error: "Enter a valid email address."
        });
      }

      if (!validStrongPassword(password)) {
        return res.status(400).json({
          error:
            "Use at least 16 characters with uppercase, lowercase, number and special character."
        });
      }

      // Never allow the first-owner setup to be reused.
      const existingOwner = await query(
        "SELECT id FROM users WHERE role = 'owner' LIMIT 1"
      );

      if (existingOwner.rowCount > 0) {
        return res.status(409).json({
          error:
            "System Owner is already configured. Ask the current Owner to create or transfer an account."
        });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const result = await query(
        `INSERT INTO users
          (
            name,
            email,
            password_hash,
            role,
            active,
            approval_status,
            approved_at
          )
         VALUES ($1, $2, $3, 'owner', TRUE, 'approved', NOW())
         RETURNING id, name, email, role, active, approval_status`,
        [name, email, passwordHash]
      );

      const owner = result.rows[0];

      await writeAuditLog({
        userId: owner.id,
        action: "SYSTEM_OWNER_INITIALIZED",
        entityType: "user",
        entityId: owner.id
      });

      return res.status(201).json({
        message: "System Owner account created.",
        token: createToken(owner),
        user: publicUser(owner)
      });

    } catch (error) {
      if (error?.constraint === "users_email_key") {
        return res.status(409).json({
          error: "This email address is already registered."
        });
      }

      if (error?.constraint === "idx_users_single_active_owner") {
        return res.status(409).json({
          error: "A System Owner has already been created."
        });
      }

      return next(error);
    }
  }
);

/* =====================================================
   2. PUBLIC STAFF REGISTRATION
   New accounts remain pending until approved.
   ===================================================== */

router.post(
  "/register",
  authLimiter,
  validateRequired("name", "email", "password"),
  async (req, res, next) => {
    try {
      const name = String(req.body.name).trim();
      const email = String(req.body.email).trim().toLowerCase();
      const password = String(req.body.password);

      if (name.length < 2 || name.length > 100) {
        return res.status(400).json({
          error: "Enter a valid name."
        });
      }

      if (!validEmail(email)) {
        return res.status(400).json({
          error: "Enter a valid email address."
        });
      }

      if (!validStaffPassword(password)) {
        return res.status(400).json({
          error:
            "Password must contain at least 12 characters and be no longer than 72 UTF-8 bytes."
        });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const result = await query(
        `INSERT INTO users
          (
            name,
            email,
            password_hash,
            role,
            active,
            approval_status
          )
         VALUES ($1, $2, $3, 'staff', FALSE, 'pending')
         RETURNING id, name, email, role, active, approval_status`,
        [name, email, passwordHash]
      );

      const user = result.rows[0];

      await writeAuditLog({
        userId: user.id,
        action: "STAFF_REGISTRATION_PENDING",
        entityType: "user",
        entityId: user.id
      });

      return res.status(201).json({
        message:
          "Registration submitted. An administrator must approve your account before you can sign in.",
        user: publicUser(user)
      });

    } catch (error) {
      if (isDuplicateEmail(error)) {
        return res.status(409).json({
          error:
            "This email is already registered. Please sign in or contact an administrator."
        });
      }

      return next(error);
    }
  }
);

/* =====================================================
   3. LOGIN
   Owner, Admin, Staff and Viewer use email/password.
   ===================================================== */

router.post(
  "/login",
  authLimiter,
  validateRequired("email", "password"),
  async (req, res, next) => {
    try {
      const email = String(req.body.email).trim().toLowerCase();
      const password = String(req.body.password);

      const result = await query(
        `SELECT
           id,
           name,
           email,
           password_hash,
           role,
           active,
           approval_status
         FROM users
         WHERE email = $1
         LIMIT 1`,
        [email]
      );

      const user = result.rows[0];

      const passwordMatches = user
        ? await bcrypt.compare(password, user.password_hash)
        : false;

      if (!user || !passwordMatches) {
        return res.status(401).json({
          error: "Incorrect email or password."
        });
      }

      if (user.approval_status === "pending") {
        return res.status(403).json({
          error:
            "Your account is awaiting administrator approval."
        });
      }

      if (
        user.approval_status !== "approved" ||
        !user.active
      ) {
        return res.status(403).json({
          error:
            "This account is not active. Contact an administrator."
        });
      }

      const token = createToken(user);

      await writeAuditLog({
        userId: user.id,
        action: "USER_LOGIN",
        entityType: "user",
        entityId: user.id
      });

      return res.json({
        token,
        user: publicUser(user)
      });

    } catch (error) {
      return next(error);
    }
  }
);

/* =====================================================
   4. CHECK CURRENT LOGIN SESSION
   ===================================================== */

router.get(
  "/me",
  authenticate,
  async (req, res, next) => {
    try {
      const result = await query(
        `SELECT
           id,
           name,
           email,
           role,
           active,
           approval_status
         FROM users
         WHERE id = $1
         LIMIT 1`,
        [req.user.id]
      );

      const user = result.rows[0];

      if (
        !user ||
        !user.active ||
        user.approval_status !== "approved"
      ) {
        return res.status(401).json({
          error: "Your account is inactive or not approved."
        });
      }

      return res.json({
        user: publicUser(user)
      });

    } catch (error) {
      return next(error);
    }
  }
);

/* =====================================================
   5. VIEW ALL USERS
   Owner and Admin only.
   ===================================================== */

router.get(
  "/users",
  authenticate,
  authorize("admin"),
  async (req, res, next) => {
    try {
      const result = await query(
        `SELECT
           id,
           name,
           email,
           role,
           active,
           approval_status,
           approved_by,
           approved_at,
           created_by,
           created_at
         FROM users
         ORDER BY
           CASE approval_status
             WHEN 'pending' THEN 0
             ELSE 1
           END,
           created_at DESC`
      );

      return res.json({
        users: result.rows
      });

    } catch (error) {
      return next(error);
    }
  }
);

/* =====================================================
   6. APPROVE OR REJECT STAFF REGISTRATION
   Owner and Admin only.
   ===================================================== */

router.patch(
  "/users/:id/approval",
  authenticate,
  authorize("admin"),
  validateRequired("status"),
  async (req, res, next) => {
    try {
      const userId = Number(req.params.id);
      const status = String(req.body.status).toLowerCase();

      if (!Number.isSafeInteger(userId) || userId <= 0) {
        return res.status(400).json({
          error: "Invalid user ID."
        });
      }

      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({
          error: "Status must be approved or rejected."
        });
      }

      const result = await query(
        `UPDATE users
         SET
           approval_status = $1,
           active = ($1 = 'approved'),
           approved_by = $2,
           approved_at =
             CASE WHEN $1 = 'approved' THEN NOW() ELSE NULL END,
           updated_at = NOW()
         WHERE id = $3
           AND role = 'staff'
           AND approval_status = 'pending'
         RETURNING id, name, email, role, active, approval_status`,
        [status, req.user.id, userId]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          error: "Pending Staff account not found."
        });
      }

      await writeAuditLog({
        userId: req.user.id,
        action:
          status === "approved"
            ? "STAFF_ACCOUNT_APPROVED"
            : "STAFF_ACCOUNT_REJECTED",
        entityType: "user",
        entityId: userId
      });

      return res.json({
        message: `Staff account ${status}.`,
        user: result.rows[0]
      });

    } catch (error) {
      return next(error);
    }
  }
);

/* =====================================================
   7. CREATE ACCOUNTS
   Owner can create Admin, Staff and Viewer.
   Admin can create Staff and Viewer only.
   ===================================================== */

router.post(
  "/users",
  authenticate,
  authorize("admin"),
  validateRequired("name", "email", "password", "role"),
  async (req, res, next) => {
    try {
      const name = String(req.body.name).trim();
      const email = String(req.body.email).trim().toLowerCase();
      const password = String(req.body.password);
      const role = String(req.body.role).toLowerCase();

      if (
        name.length < 2 ||
        name.length > 100 ||
        !validEmail(email)
      ) {
        return res.status(400).json({
          error: "Enter a valid name and email address."
        });
      }

      if (!["admin", "staff", "viewer"].includes(role)) {
        return res.status(400).json({
          error: "Invalid role."
        });
      }

      if (role === "admin" && req.user.role !== "owner") {
        return res.status(403).json({
          error:
            "Only the System Owner can create Admin accounts."
        });
      }

      const passwordValid =
        role === "admin"
          ? validStrongPassword(password)
          : validStaffPassword(password);

      if (!passwordValid) {
        return res.status(400).json({
          error:
            role === "admin"
              ? "Admin passwords require at least 16 characters with uppercase, lowercase, number and special character."
              : "Password must contain at least 12 characters."
        });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const result = await query(
        `INSERT INTO users
          (
            name,
            email,
            password_hash,
            role,
            active,
            approval_status,
            approved_by,
            approved_at,
            created_by
          )
         VALUES ($1, $2, $3, $4, TRUE, 'approved', $5, NOW(), $5)
         RETURNING id, name, email, role, active, approval_status`,
        [name, email, passwordHash, role, req.user.id]
      );

      const createdUser = result.rows[0];

      await writeAuditLog({
        userId: req.user.id,
        action: "USER_CREATED_BY_ADMIN",
        entityType: "user",
        entityId: createdUser.id,
        details: { role }
      });

      return res.status(201).json({
        user: createdUser
      });

    } catch (error) {
      if (isDuplicateEmail(error)) {
        return res.status(409).json({
          error: "This email address is already registered."
        });
      }

      return next(error);
    }
  }
);

/* =====================================================
   8. CHANGE YOUR OWN PASSWORD
   ===================================================== */

router.post(
  "/change-password",
  authenticate,
  validateRequired("currentPassword", "newPassword"),
  async (req, res, next) => {
    try {
      const result = await query(
        `SELECT id, password_hash, role
         FROM users
         WHERE id = $1
           AND active = TRUE
           AND approval_status = 'approved'`,
        [req.user.id]
      );

      const user = result.rows[0];

      if (
        !user ||
        !(await bcrypt.compare(
          String(req.body.currentPassword),
          user.password_hash
        ))
      ) {
        return res.status(401).json({
          error: "Current password is incorrect."
        });
      }

      const newPassword = String(req.body.newPassword);

      const passwordValid =
        ["owner", "admin"].includes(user.role)
          ? validStrongPassword(newPassword)
          : validStaffPassword(newPassword);

      if (!passwordValid) {
        return res.status(400).json({
          error:
            "Use a valid password. Admin and Owner passwords require at least 16 characters with uppercase, lowercase, number and special character."
        });
      }

      const hash = await bcrypt.hash(newPassword, 12);

      await query(
        `UPDATE users
         SET password_hash = $1, updated_at = NOW()
         WHERE id = $2`,
        [hash, user.id]
      );

      await writeAuditLog({
        userId: user.id,
        action: "USER_PASSWORD_CHANGED",
        entityType: "user",
        entityId: user.id
      });

      return res.json({
        message:
          "Password updated. Sign in again on your other devices."
      });

    } catch (error) {
      return next(error);
    }
  }
);

/* =====================================================
   9. ACTIVATE OR DEACTIVATE A USER
   Owner/Admin only. Owner accounts are protected.
   ===================================================== */

router.patch(
  "/users/:id/active",
  authenticate,
  authorize("admin"),
  validateRequired("active"),
  async (req, res, next) => {
    try {
      const userId = Number(req.params.id);
      const active = req.body.active;

      if (
        !Number.isSafeInteger(userId) ||
        userId <= 0 ||
        typeof active !== "boolean"
      ) {
        return res.status(400).json({
          error: "Provide a valid user ID and active value."
        });
      }

      if (
        userId === Number(req.user.id) &&
        active === false
      ) {
        return res.status(400).json({
          error: "You cannot deactivate your own account."
        });
      }

      const result = await query(
        `UPDATE users
         SET active = $1, updated_at = NOW()
         WHERE id = $2
           AND role <> 'owner'
         RETURNING id, name, email, role, active, approval_status`,
        [active, userId]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          error: "User not found or cannot be changed."
        });
      }

      await writeAuditLog({
        userId: req.user.id,
        action: active ? "USER_ACTIVATED" : "USER_DEACTIVATED",
        entityType: "user",
        entityId: userId
      });

      return res.json({
        user: result.rows[0]
      });

    } catch (error) {
      return next(error);
    }
  }
);

export default router;