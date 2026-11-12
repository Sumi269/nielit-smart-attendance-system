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
      `SELECT c.id, c.name, c.code, c.description, c.active,
              COUNT(DISTINCT b.id)::INT AS "batchCount",
              COUNT(DISTINCT bs.student_id)::INT AS "studentCount"
       FROM courses c
       LEFT JOIN batches b ON b.course_id = c.id AND b.active = TRUE
       LEFT JOIN batch_students bs ON bs.batch_id = b.id
       WHERE ($1 = 'all' OR c.active = ($1 = 'true'))
       GROUP BY c.id
       ORDER BY c.name`,
      [String(req.query.active || "true")]
    );

    res.json({ courses: result.rows });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/",
  authorize("admin"),
  validateRequired("name", "code"),
  async (req, res, next) => {
    try {
      const result = await query(
        `INSERT INTO courses (name, code, description)
         VALUES ($1, UPPER($2), $3)
         RETURNING *`,
        [
          req.body.name.trim(),
          req.body.code.trim(),
          req.body.description || null
        ]
      );

      await writeAuditLog({
        userId: req.user.id,
        action: "COURSE_CREATED",
        entityType: "course",
        entityId: result.rows[0].id
      });

      res.status(201).json({ course: result.rows[0] });
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  "/:id",
  authorize("admin"),
  validateRequired("name", "code"),
  async (req, res, next) => {
    try {
      const result = await query(
        `UPDATE courses
         SET name = $1, code = UPPER($2), description = $3
         WHERE id = $4 RETURNING *`,
        [
          req.body.name.trim(),
          req.body.code.trim(),
          req.body.description || null,
          req.params.id
        ]
      );

      if (!result.rows[0]) {
        return res.status(404).json({ error: "Course not found." });
      }

      await writeAuditLog({
        userId: req.user.id,
        action: "COURSE_UPDATED",
        entityType: "course",
        entityId: Number(req.params.id)
      });

      res.json({ course: result.rows[0] });
    } catch (error) {
      next(error);
    }
  }
);

router.patch("/:id/deactivate", authorize("admin"), async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE courses SET active = FALSE WHERE id = $1 RETURNING *`,
      [req.params.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: "Course not found." });
    }

    await writeAuditLog({
      userId: req.user.id,
      action: "COURSE_DEACTIVATED",
      entityType: "course",
      entityId: Number(req.params.id)
    });

    res.json({ course: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

export default router;