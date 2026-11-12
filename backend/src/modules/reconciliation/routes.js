import { Router } from "express";
import { query } from "../../config/database.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";

const router = Router();

router.use(authenticate);
router.use(authorize("admin", "staff"));

router.get("/", async (req, res, next) => {
  try {
    const { batchId = "", from = "", to = "" } = req.query;

    const result = await query(
      `SELECT cs.id AS "sessionId",
              cs.session_date AS "sessionDate",
              cs.title,
              cs.status AS "sessionStatus",
              b.id AS "batchId",
              b.name AS "batchName",
              c.name AS "courseName",
              COUNT(DISTINCT bs.student_id)::INT AS "enrolledStudents",
              COUNT(DISTINCT ar.student_id)::INT AS "recordedStudents",
              COUNT(DISTINCT bs.student_id)
                - COUNT(DISTINCT ar.student_id) AS "unrecordedStudents"
       FROM class_sessions cs
       JOIN batches b ON b.id = cs.batch_id
       JOIN courses c ON c.id = b.course_id
       LEFT JOIN batch_students bs
         ON bs.batch_id = cs.batch_id
        AND bs.enrolled_on <= cs.session_date
        AND (bs.left_on IS NULL OR bs.left_on >= cs.session_date)
       LEFT JOIN attendance_records ar
         ON ar.session_id = cs.id
        AND ar.student_id = bs.student_id
       WHERE ($1 = '' OR cs.batch_id = NULLIF($1, '')::BIGINT)
         AND ($2 = '' OR cs.session_date >= $2::DATE)
         AND ($3 = '' OR cs.session_date <= $3::DATE)
       GROUP BY cs.id, b.id, b.name, c.name
       ORDER BY cs.session_date DESC
       LIMIT 500`,
      [String(batchId), String(from), String(to)]
    );

    res.json({
      sessions: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    next(error);
  }
});

export default router;