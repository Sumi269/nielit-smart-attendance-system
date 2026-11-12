
import { Router } from "express";
import { pool, query } from "../../config/database.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validateRequired } from "../../middleware/validate.js";

const router = Router();

router.use(authenticate);

function addAudit(client, userId, action, entityId, details = {}) {
  return client.query(
    `INSERT INTO audit_logs
       (user_id, action, entity_type, entity_id, details)
     VALUES ($1, $2, 'student', $3, $4)`,
    [userId, action, entityId, JSON.stringify(details)]
  );
}

// GET /api/students
router.get("/", async (req, res, next) => {
  try {
    const {
      search = "",
      batchId = "",
      active = "true",
    } = req.query;

    const result = await query(
      `SELECT
         s.id,
         s.student_code AS "studentCode",
         s.full_name AS "fullName",
         s.email,
         s.phone,
         s.active,
         COALESCE(
           json_agg(
             json_build_object(
               'batchId', b.id,
               'batchName', b.name,
               'courseId', c.id,
               'courseName', c.name,
               'academicYear', b.academic_year,
               'enrolledOn', bs.enrolled_on,
               'leftOn', bs.left_on
             )
           ) FILTER (WHERE b.id IS NOT NULL),
           '[]'::json
         ) AS batches
       FROM students s
       LEFT JOIN batch_students bs ON bs.student_id = s.id
       LEFT JOIN batches b ON b.id = bs.batch_id
       LEFT JOIN courses c ON c.id = b.course_id
       WHERE
         ($1 = '' OR s.student_code ILIKE '%' || $1 || '%'
                   OR s.full_name ILIKE '%' || $1 || '%')
         AND ($2 = '' OR b.id = NULLIF($2, '')::BIGINT)
         AND ($3 = 'all' OR s.active = ($3 = 'true'))
       GROUP BY s.id
       ORDER BY s.full_name
       LIMIT 500`,
      [String(search), String(batchId), String(active)]
    );

    res.json({
      students: result.rows,
      count: result.rowCount,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/students/:id
router.get("/:id", async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
         s.id,
         s.student_code AS "studentCode",
         s.full_name AS "fullName",
         s.email,
         s.phone,
         s.active,
         COALESCE(
           json_agg(
             json_build_object(
               'batchId', b.id,
               'batchName', b.name,
               'courseId', c.id,
               'courseName', c.name,
               'academicYear', b.academic_year,
               'enrolledOn', bs.enrolled_on,
               'leftOn', bs.left_on
             )
           ) FILTER (WHERE b.id IS NOT NULL),
           '[]'::json
         ) AS batches
       FROM students s
       LEFT JOIN batch_students bs ON bs.student_id = s.id
       LEFT JOIN batches b ON b.id = bs.batch_id
       LEFT JOIN courses c ON c.id = b.course_id
       WHERE s.id = $1
       GROUP BY s.id`,
      [req.params.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: "Student not found." });
    }

    res.json({ student: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// POST /api/students
router.post(
  "/",
  authorize("admin", "staff"),
  validateRequired("studentCode", "fullName", "batchId"),
  async (req, res, next) => {
    const client = await pool.connect();

    try {
      const {
        studentCode,
        fullName,
        email = null,
        phone = null,
        batchId,
      } = req.body;

      if (!String(studentCode).trim() || !String(fullName).trim()) {
        return res.status(400).json({
          error: "Student ID and student name cannot be empty.",
        });
      }

      await client.query("BEGIN");

      const batch = await client.query(
        `SELECT id FROM batches
         WHERE id = $1 AND active = TRUE`,
        [batchId]
      );

      if (!batch.rowCount) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          error: "Select a valid active batch.",
        });
      }

      const inserted = await client.query(
        `INSERT INTO students
           (student_code, full_name, email, phone)
         VALUES ($1, $2, $3, $4)
         RETURNING
           id,
           student_code AS "studentCode",
           full_name AS "fullName",
           email,
           phone,
           active`,
        [
          String(studentCode).trim(),
          String(fullName).trim(),
          email ? String(email).trim() : null,
          phone ? String(phone).trim() : null,
        ]
      );

      const student = inserted.rows[0];

      await client.query(
        `INSERT INTO batch_students (student_id, batch_id)
         VALUES ($1, $2)`,
        [student.id, batchId]
      );

      await addAudit(
        client,
        req.user.id,
        "STUDENT_CREATED",
        student.id,
        { batchId: Number(batchId) }
      );

      await client.query("COMMIT");

      res.status(201).json({
        message: "Student created and enrolled successfully.",
        student,
      });
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      next(error);
    } finally {
      client.release();
    }
  }
);

// PUT /api/students/:id
router.put(
  "/:id",
  authorize("admin", "staff"),
  validateRequired("studentCode", "fullName"),
  async (req, res, next) => {
    const client = await pool.connect();

    try {
      const {
        studentCode,
        fullName,
        email = null,
        phone = null,
        batchId,
      } = req.body;

      await client.query("BEGIN");

      const updated = await client.query(
        `UPDATE students
         SET student_code = $1,
             full_name = $2,
             email = $3,
             phone = $4,
             updated_at = NOW()
         WHERE id = $5
         RETURNING
           id,
           student_code AS "studentCode",
           full_name AS "fullName",
           email,
           phone,
           active`,
        [
          String(studentCode).trim(),
          String(fullName).trim(),
          email ? String(email).trim() : null,
          phone ? String(phone).trim() : null,
          req.params.id,
        ]
      );

      if (!updated.rowCount) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Student not found." });
      }

      const student = updated.rows[0];

      // Change enrollment only when a batchId is supplied.
      if (batchId !== undefined && batchId !== null && batchId !== "") {
        const batch = await client.query(
          `SELECT id FROM batches WHERE id = $1 AND active = TRUE`,
          [batchId]
        );

        if (!batch.rowCount) {
          await client.query("ROLLBACK");
          return res.status(400).json({
            error: "Select a valid active batch.",
          });
        }

        const current = await client.query(
          `SELECT batch_id AS "batchId"
           FROM batch_students
           WHERE student_id = $1 AND left_on IS NULL
           ORDER BY enrolled_on DESC
           LIMIT 1`,
          [student.id]
        );

        const currentBatchId = current.rows[0]?.batchId;

        if (String(currentBatchId || "") !== String(batchId)) {
          await client.query(
            `UPDATE batch_students
             SET left_on = CURRENT_DATE
             WHERE student_id = $1 AND left_on IS NULL`,
            [student.id]
          );

          await client.query(
            `INSERT INTO batch_students (student_id, batch_id)
             VALUES ($1, $2)
             ON CONFLICT (student_id, batch_id)
             DO UPDATE SET enrolled_on = CURRENT_DATE, left_on = NULL`,
            [student.id, batchId]
          );
        }
      }

      await addAudit(
        client,
        req.user.id,
        "STUDENT_UPDATED",
        student.id,
        { batchId: batchId || null }
      );

      await client.query("COMMIT");

      res.json({ message: "Student updated successfully.", student });
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      next(error);
    } finally {
      client.release();
    }
  }
);

// PATCH /api/students/:id/deactivate
router.patch(
  "/:id/deactivate",
  authorize("admin"),
  async (req, res, next) => {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const result = await client.query(
        `UPDATE students
         SET active = FALSE, updated_at = NOW()
         WHERE id = $1
         RETURNING id, student_code AS "studentCode",
                   full_name AS "fullName", active`,
        [req.params.id]
      );

      if (!result.rowCount) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Student not found." });
      }

      await addAudit(
        client,
        req.user.id,
        "STUDENT_DEACTIVATED",
        result.rows[0].id
      );

      await client.query("COMMIT");

      res.json({ student: result.rows[0] });
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      next(error);
    } finally {
      client.release();
    }
  }
);

export default router;
