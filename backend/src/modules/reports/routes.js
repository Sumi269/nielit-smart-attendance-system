import { Router } from "express";
import { query } from "../../config/database.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { createAttendancePdf } from "../../utils/pdfReports.js";

const router = Router();

router.use(authenticate);
router.use(authorize("admin", "staff", "viewer"));

router.get("/attendance", async (req, res, next) => {
  try {
    const {
      batchId = "",
      from = "",
      to = "",
      threshold = "75",
      format = "json"
    } = req.query;

    const cutoff = Number(threshold);

    if (!Number.isFinite(cutoff) || cutoff < 0 || cutoff > 100) {
      return res.status(400).json({
        error: "threshold must be between 0 and 100."
      });
    }

    const result = await query(
      `SELECT
         s.id AS "studentId",
         s.student_code AS "studentCode",
         s.full_name AS "fullName",
         b.id AS "batchId",
         b.name AS "batchName",
         c.name AS "courseName",
         COUNT(cs.id) FILTER (WHERE cs.status = 'held')::INT
           AS "classesConducted",
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
       JOIN batches b ON b.id = bs.batch_id
       JOIN courses c ON c.id = b.course_id
       LEFT JOIN class_sessions cs
         ON cs.batch_id = b.id
        AND cs.session_date >= bs.enrolled_on
        AND (bs.left_on IS NULL OR cs.session_date <= bs.left_on)
        AND ($2 = '' OR cs.session_date >= $2::DATE)
        AND ($3 = '' OR cs.session_date <= $3::DATE)
       LEFT JOIN attendance_records ar
         ON ar.session_id = cs.id AND ar.student_id = s.id
       WHERE s.active = TRUE
         AND ($1 = '' OR b.id = NULLIF($1, '')::BIGINT)
       GROUP BY s.id, b.id, b.name, c.name
       ORDER BY c.name, b.name, s.full_name`,
      [String(batchId), String(from), String(to)]
    );

    const students = result.rows.map((student) => {
      const classesConducted = Number(student.classesConducted || 0);
      const present = Number(student.present || 0);
      const absent = Number(student.absent || 0);
      const excused = Number(student.excused || 0);

      const applicableClasses = Math.max(0, classesConducted - excused);

      const percentage =
        applicableClasses > 0
          ? Number(((present / applicableClasses) * 100).toFixed(2))
          : 0;

      return {
        ...student,
        classesConducted,
        present,
        absent,
        excused,
        applicableClasses,
        percentage,
        eligible: applicableClasses > 0 && percentage >= cutoff
      };
    });

    if (format === "pdf") {
      const pdf = await createAttendancePdf({
        title: "Student Attendance Report",
        course: students[0]?.courseName || "All courses",
        batch: students[0]?.batchName || "All batches",
        academicYear: "",
        threshold: cutoff,
        students
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="attendance-report.pdf"'
      );

      return res.send(pdf);
    }

    const totals = students.reduce(
      (summary, student) => {
        summary.students += 1;
        summary.present += student.present;
        summary.absent += student.absent;

        if (student.eligible) {
          summary.eligible += 1;
        }

        return summary;
      },
      { students: 0, present: 0, absent: 0, eligible: 0 }
    );

    res.json({
      threshold: cutoff,
      totals,
      students
    });
  } catch (error) {
    next(error);
  }
});

export default router;