import { query } from "../config/database.js";

export async function writeAuditLog({
  userId = null,
  action,
  entityType,
  entityId = null,
  details = {}
}) {
  await query(
    `INSERT INTO audit_logs
      (user_id, action, entity_type, entity_id, details)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      userId,
      action,
      entityType,
      entityId,
      JSON.stringify(details)
    ]
  );
}