import { Router } from "express";
import { query } from "../../config/database.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validateRequired } from "../../middleware/validate.js";
import { writeAuditLog } from "../../utils/audit.js";

const router = Router();

router.use(authenticate);

router.get("/", authorize("admin", "staff", "viewer"), async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, device_code AS "deviceCode",
              device_name AS "deviceName",
              device_type AS "deviceType",
              batch_id AS "batchId",
              active,
              last_seen_at AS "lastSeenAt",
              created_at AS "createdAt"
       FROM biometric_devices
       ORDER BY device_name`
    );

    res.json({ devices: result.rows });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/",
  authorize("admin"),
  validateRequired("deviceCode", "deviceName", "deviceType"),
  async (req, res, next) => {
    try {
      const { deviceCode, deviceName, deviceType, batchId = null } = req.body;

      const result = await query(
        `INSERT INTO biometric_devices
           (device_code, device_name, device_type, batch_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id, device_code AS "deviceCode",
                   device_name AS "deviceName",
                   device_type AS "deviceType",
                   batch_id AS "batchId", active`,
        [
          deviceCode.trim(),
          deviceName.trim(),
          deviceType.trim(),
          batchId || null
        ]
      );

      await writeAuditLog({
        userId: req.user.id,
        action: "DEVICE_REGISTERED",
        entityType: "biometric_device",
        entityId: result.rows[0].id
      });

      res.status(201).json({ device: result.rows[0] });
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  "/:id/deactivate",
  authorize("admin"),
  async (req, res, next) => {
    try {
      const result = await query(
        `UPDATE biometric_devices
         SET active = FALSE
         WHERE id = $1 RETURNING id, device_code, device_name, active`,
        [req.params.id]
      );

      if (!result.rows[0]) {
        return res.status(404).json({ error: "Device not found." });
      }

      await writeAuditLog({
        userId: req.user.id,
        action: "DEVICE_DEACTIVATED",
        entityType: "biometric_device",
        entityId: Number(req.params.id)
      });

      res.json({ device: result.rows[0] });
    } catch (error) {
      next(error);
    }
  }
);

export default router;