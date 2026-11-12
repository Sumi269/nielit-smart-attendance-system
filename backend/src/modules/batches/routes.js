import { Router } from "express";
import { query } from "../../config/database.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validateRequired } from "../../middleware/validate.js";
import { writeAuditLog } from "../../utils/audit.js";

const router = Router();

router.use(authenticate);

router.get("/", async (req, res, next) => {
  try {
    const result = await query(
      `SELECT b.id, b.name, b.academic_year AS "academicYear",
              b.course_id AS "courseId", c.name AS "courseName",
              b.start_date AS "startDate", b.end_date AS "endDate",
              b.active,
              COUNT(DISTINCT bs.student_id)::INT AS "studentCount"
       FROM batches b
       JOIN courses c ON c.id = b.course_id
       LEFT JOIN batch_students bs ON bs.batch_id = b.id
       WHERE ($1 = '' OR b.academic_year = $1)
         AND ($2 = '' OR b.course_id = NULLIF($2, '')::BIGINT)
         AND ($3 = 'all' OR b.active = ($3 = 'true'))
       GROUP BY b.id, c.name
       ORDER BY b.academic_year DESC, c.name, b.name`,
      [
        String(req.query.academicYear || ""),
        String(req.query.courseId || ""),
        String(req.query.active || "true")
      ]
    );

    res.json({ batches: result.rows });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/",
  authorize("admin"),
  validateRequired("name", "courseId", "academicYear"),
  async (req, res, next) => {
    try {
      const { name, courseId, academicYear, startDate, endDate } = req.body;

      const result = await query(
        `INSERT INTO batches
           (name, course_id, academic_year, start_date, end_date)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          name.trim(),
          courseId,
          academicYear.trim(),
          startDate || null,
          endDate || null
        ]
      );

      await writeAuditLog({
        userId: req.user.id,
        action: "BATCH_CREATED",
        entityType: "batch",
        entityId: result.rows[0].id
      });

      res.status(201).json({ batch: result.rows[0] });
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  "/:id",
  authorize("admin"),
  validateRequired("name", "courseId", "academicYear"),
  async (req, res, next) => {
    try {
      const { name, courseId, academicYear, startDate, endDate } = req.body;

      const result = await query(
        `UPDATE batches
         SET name = $1, course_id = $2, academic_year = $3,
             start_date = $4, end_date = $5
         WHERE id = $6 RETURNING *`,
        [
          name.trim(),
          courseId,
          academicYear.trim(),
          startDate || null,
          endDate || null,
          req.params.id
        ]
      );

      if (!result.rows[0]) {
        return res.status(404).json({ error: "Batch not found." });
      }

      await writeAuditLog({
        userId: req.user.id,
        action: "BATCH_UPDATED",
        entityType: "batch",
        entityId: Number(req.params.id)
      });

      res.json({ batch: result.rows[0] });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/:id/students",
  authorize("admin", "staff"),
  validateRequired("studentId"),
  async (req, res, next) => {
    try {
      const result = await query(
        `INSERT INTO batch_students (student_id, batch_id)
         VALUES ($1, $2)
         ON CONFLICT (student_id, batch_id) DO NOTHING
         RETURNING *`,
        [req.body.studentId, req.params.id]
      );

      await writeAuditLog({
        userId: req.user.id,
        action: "STUDENT_ENROLLED_IN_BATCH",
        entityType: "batch",
        entityId: Number(req.params.id),
        details: { studentId: req.body.studentId }
      });

      res.status(201).json({
        message: result.rowCount ? "Student enrolled." : "Student is already enrolled.",
        enrollment: result.rows[0] || null
      });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/:id/students/:studentId",
  authorize("admin"),
  async (req, res, next) => {
    try {
      const result = await query(
        `UPDATE batch_students SET left_on = CURRENT_DATE
         WHERE batch_id = $1 AND student_id = $2 AND left_on IS NULL
         RETURNING *`,
        [req.params.id, req.params.studentId]
      );

      if (!result.rowCount) {
        return res.status(404).json({
          error: "Active student enrolment not found."
        });
      }

      await writeAuditLog({
        userId: req.user.id,
        action: "STUDENT_WITHDRAWN_FROM_BATCH",
        entityType: "batch",
        entityId: Number(req.params.id),
        details: { studentId: Number(req.params.studentId) }
      });

      res.json({ message: "Enrolment ended; historical attendance retained." });
    } catch (error) {
      next(error);
    }
  }
);

router.patch("/:id/deactivate", authorize("admin"), async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE batches SET active = FALSE WHERE id = $1 RETURNING *`,
      [req.params.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: "Batch not found." });
    }

    await writeAuditLog({
      userId: req.user.id,
      action: "BATCH_DEACTIVATED",
      entityType: "batch",
      entityId: Number(req.params.id)
    });

    res.json({ batch: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

export default router;