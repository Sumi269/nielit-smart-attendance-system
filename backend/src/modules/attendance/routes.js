import { Router } from "express";
import { query } from "../../config/database.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validateRequired } from "../../middleware/validate.js";
import { isValidDate } from "../../utils/validators.js";
import { writeAuditLog } from "../../utils/audit.js";

const router = Router();

router.use(authenticate);

router.get("/sessions", async (req, res, next) => {
  try {
    const { batchId = "", from = "", to = "" } = req.query;

    const result = await query(
      `SELECT cs.id, cs.batch_id AS "batchId",
              b.name AS "batchName", c.name AS "courseName",
              cs.session_date AS "sessionDate",
              cs.title, cs.status
       FROM class_sessions cs
       JOIN batches b ON b.id = cs.batch_id
       JOIN courses c ON c.id = b.course_id
       WHERE ($1 = '' OR cs.batch_id = NULLIF($1, '')::BIGINT)
         AND ($2 = '' OR cs.session_date >= $2::DATE)
         AND ($3 = '' OR cs.session_date <= $3::DATE)
       ORDER BY cs.session_date DESC
       LIMIT 500`,
      [String(batchId), String(from), String(to)]
    );

    res.json({ sessions: result.rows });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/sessions",
  authorize("admin", "staff"),
  validateRequired("batchId", "sessionDate"),
  async (req, res, next) => {
    try {
      const { batchId, sessionDate, title = "Class" } = req.body;

      if (!isValidDate(sessionDate)) {
        return res.status(400).json({
          error: "sessionDate must be a valid YYYY-MM-DD date."
        });
      }

      const result = await query(
        `INSERT INTO class_sessions
           (batch_id, session_date, title, created_by)
         VALUES ($1, $2, $3, $4)
         RETURNING id, batch_id AS "batchId",
                   session_date AS "sessionDate", title, status`,
        [batchId, sessionDate, title, req.user.id]
      );

      await writeAuditLog({
        userId: req.user.id,
        action: "CLASS_SESSION_CREATED",
        entityType: "class_session",
        entityId: result.rows[0].id
      });

      res.status(201).json({ session: result.rows[0] });
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  "/sessions/:id/cancel",
  authorize("admin"),
  async (req, res, next) => {
    try {
      const result = await query(
        `UPDATE class_sessions SET status = 'cancelled'
         WHERE id = $1 RETURNING *`,
        [req.params.id]
      );

      if (!result.rows[0]) {
        return res.status(404).json({ error: "Session not found." });
      }

      await writeAuditLog({
        userId: req.user.id,
        action: "CLASS_SESSION_CANCELLED",
        entityType: "class_session",
        entityId: Number(req.params.id)
      });

      res.json({ session: result.rows[0] });
    } catch (error) {
      next(error);
    }
  }
);

router.get("/sessions/:id/records", async (req, res, next) => {
  try {
    const result = await query(
      `SELECT s.id AS "studentId",
              s.student_code AS "studentCode",
              s.full_name AS "fullName",
              ar.status,
              ar.source,
              ar.updated_at AS "updatedAt"
       FROM class_sessions cs
       JOIN batch_students bs ON bs.batch_id = cs.batch_id
       JOIN students s ON s.id = bs.student_id
       LEFT JOIN attendance_records ar
         ON ar.session_id = cs.id AND ar.student_id = s.id
       WHERE cs.id = $1
         AND s.active = TRUE
         AND bs.enrolled_on <= cs.session_date
         AND (bs.left_on IS NULL OR bs.left_on >= cs.session_date)
       ORDER BY s.full_name`,
      [req.params.id]
    );

    res.json({ records: result.rows });
  } catch (error) {
    next(error);
  }
});

router.put(
  "/sessions/:id/records",
  authorize("admin", "staff"),
  validateRequired("studentId", "status"),
  async (req, res, next) => {
    try {
      const { studentId, status, source = "manual" } = req.body;

      const allowedStatuses = ["present", "absent", "leave", "excused"];
      const allowedSources = ["manual", "voice", "import", "device"];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid attendance status." });
      }

      if (!allowedSources.includes(source)) {
        return res.status(400).json({ error: "Invalid attendance source." });
      }

      const result = await query(
        `INSERT INTO attendance_records
           (session_id, student_id, status, source, marked_by)
         SELECT cs.id, bs.student_id, $3, $4, $5
         FROM class_sessions cs
         JOIN batch_students bs ON bs.batch_id = cs.batch_id
         JOIN students s ON s.id = bs.student_id
         WHERE cs.id = $1
           AND cs.status = 'held'
           AND bs.student_id = $2
           AND s.active = TRUE
           AND bs.enrolled_on <= cs.session_date
           AND (bs.left_on IS NULL OR bs.left_on >= cs.session_date)
         ON CONFLICT (session_id, student_id)
         DO UPDATE SET
           status = EXCLUDED.status,
           source = EXCLUDED.source,
           marked_by = EXCLUDED.marked_by,
           updated_at = NOW()
         RETURNING *`,
        [req.params.id, studentId, status, source, req.user.id]
      );

      if (!result.rows[0]) {
        return res.status(400).json({
          error: "Session is invalid/cancelled, or the student is not enrolled."
        });
      }

      await writeAuditLog({
        userId: req.user.id,
        action: "ATTENDANCE_MARKED",
        entityType: "attendance_record",
        entityId: result.rows[0].id,
        details: {
          sessionId: Number(req.params.id),
          studentId: Number(studentId),
          status,
          source
        }
      });

      res.json({ record: result.rows[0] });
    } catch (error) {
      next(error);
    }
  }
);

router.get("/summary", async (req, res, next) => {
  try {
    const { batchId = "", from = "", to = "", threshold = "75" } = req.query;
    const cutoff = Number(threshold);

    if (!Number.isFinite(cutoff) || cutoff < 0 || cutoff > 100) {
      return res.status(400).json({
        error: "threshold must be between 0 and 100."
      });
    }

    const result = await query(
      `WITH session_totals AS (
         SELECT cs.batch_id,
                COUNT(*) FILTER (WHERE cs.status = 'held')::INT AS held
         FROM class_sessions cs
         WHERE ($1 = '' OR cs.batch_id = NULLIF($1, '')::BIGINT)
           AND ($2 = '' OR cs.session_date >= $2::DATE)
           AND ($3 = '' OR cs.session_date <= $3::DATE)
         GROUP BY cs.batch_id
       ),
       student_totals AS (
         SELECT s.id, s.student_code, s.full_name, bs.batch_id,
                COUNT(cs.id) FILTER (WHERE cs.status = 'held')::INT AS classes,
                COUNT(ar.id) FILTER (
                  WHERE cs.status = 'held' AND ar.status = 'present'
                )::INT AS present,
                COUNT(ar.id) FILTER (
                  WHERE cs.status = 'held' AND ar.status = 'absent'
                )::INT AS absent,
                COUNT(ar.id) FILTER (
                  WHERE cs.status = 'held' AND ar.status = 'excused'
                )::INT AS excused
         FROM students s
         JOIN batch_students bs ON bs.student_id = s.id
         JOIN class_sessions cs ON cs.batch_id = bs.batch_id
         LEFT JOIN attendance_records ar
           ON ar.session_id = cs.id AND ar.student_id = s.id
         WHERE s.active = TRUE
           AND bs.enrolled_on <= cs.session_date
           AND (bs.left_on IS NULL OR bs.left_on >= cs.session_date)
           AND ($1 = '' OR bs.batch_id = NULLIF($1, '')::BIGINT)
           AND ($2 = '' OR cs.session_date >= $2::DATE)
           AND ($3 = '' OR cs.session_date <= $3::DATE)
         GROUP BY s.id, s.student_code, s.full_name, bs.batch_id
       )
       SELECT st.id AS "studentId",
              st.student_code AS "studentCode",
              st.full_name AS "fullName",
              st.batch_id AS "batchId",
              st.classes AS "classesConducted",
              st.present, st.absent, st.excused,
              (st.classes - st.excused) AS "applicableClasses",
              CASE
                WHEN st.classes - st.excused > 0
                THEN ROUND(
                  st.present::NUMERIC * 100 /
                  (st.classes - st.excused), 2
                )
                ELSE 0
              END AS "percentage",
              CASE
                WHEN st.classes - st.excused > 0
                THEN st.present::NUMERIC * 100 /
                  (st.classes - st.excused) >= $4
                ELSE FALSE
              END AS eligible
       FROM student_totals st
       ORDER BY st.full_name`,
      [String(batchId), String(from), String(to), cutoff]
    );

    res.json({
      threshold: cutoff,
      students: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    next(error);
  }
});

export default router;