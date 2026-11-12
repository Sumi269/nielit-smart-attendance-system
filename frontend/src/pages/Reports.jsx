import { useMemo, useState } from "react";
import {
  FileSpreadsheet,
  Download,
  BarChart3,
  AlertCircle,
} from "lucide-react";
import { calculateAttendance } from "../utils/attendanceCalculator";

function loadStudents() {
  try {
    return JSON.parse(localStorage.getItem("nielit_students")) || [];
  } catch {
    return [];
  }
}

function loadRecords() {
  try {
    return JSON.parse(localStorage.getItem("nielit_attendance")) || {};
  } catch {
    return {};
  }
}

export default function Reports() {
  const [students] = useState(loadStudents);
  const [attendance] = useState(loadRecords);
  const [year, setYear] = useState("All");
  const [batch, setBatch] = useState("All");

  const batches = [...new Set(students.map((s) => s.batch).filter(Boolean))];
  const years = [...new Set(students.map((s) => s.year).filter(Boolean))];

  const report = useMemo(() => {
    const filtered = students.filter(
      (student) =>
        (year === "All" || student.year === year) &&
        (batch === "All" || student.batch === batch)
    );

    return filtered.map((student) => {
      let present = 0;
      let absent = 0;

      Object.values(attendance).forEach((session) => {
        const status = session?.[student.id];
        if (status === "Present") present++;
        if (status === "Absent") absent++;
      });

      const total = present + absent;

      return {
        enrollment: student.enrollment,
        name: student.name,
        course: student.course || "",
        batch: student.batch || "",
        year: student.year || "",
        present,
        absent,
        total,
        percentage: calculateAttendance(present, total),
      };
    });
  }, [students, attendance, year, batch]);

  function exportCSV() {
    const headers = [
      "Enrollment",
      "Student Name",
      "Course",
      "Batch",
      "Academic Year",
      "Present Sessions",
      "Absent Sessions",
      "Marked Sessions",
      "Attendance Percentage",
    ];

    const rows = report.map((r) => [
      r.enrollment,
      r.name,
      r.course,
      r.batch,
      r.year,
      r.present,
      r.absent,
      r.total,
      `${r.percentage}%`,
    ]);

    const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [headers, ...rows]
      .map((row) => row.map(escape).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "nielit-attendance-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  const totalPresent = report.reduce((sum, r) => sum + r.present, 0);
  const totalAbsent = report.reduce((sum, r) => sum + r.absent, 0);
  const totalMarked = totalPresent + totalAbsent;

  return (
    <section>
      <div className="page-heading">
        <div>
          <p className="eyebrow">REPORTING & ANALYTICS</p>
          <h1>Attendance Reports</h1>
          <p className="page-description">
            Review student attendance and export a filtered report.
          </p>
        </div>

        <button className="action-button" onClick={exportCSV}>
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="demo-notice">
        <AlertCircle size={18} />
        <div>
          <strong>Report data may be incomplete</strong>
          <p>
            This report reads local demo records. Official reports require
            verified class sessions and approved attendance corrections.
          </p>
        </div>
      </div>

      <div className="stats-grid">
        <Stat title="Students in Report" value={report.length} />
        <Stat title="Present Entries" value={totalPresent} />
        <Stat title="Absent Entries" value={totalAbsent} />
        <Stat
          title="Overall Marked Attendance"
          value={`${calculateAttendance(totalPresent, totalMarked)}%`}
        />
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <h2><BarChart3 size={19} /> Student Attendance Summary</h2>
            <p>Attendance is calculated from locally saved marked sessions.</p>
          </div>
        </div>

        <div className="student-toolbar" style={{ marginTop: 20 }}>
          <label className="form-field">
            <span>Academic Year</span>
            <select value={year} onChange={(e) => setYear(e.target.value)}>
              <option value="All">All years</option>
              {years.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>

          <label className="form-field">
            <span>Batch</span>
            <select value={batch} onChange={(e) => setBatch(e.target.value)}>
              <option value="All">All batches</option>
              {batches.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>ENROLLMENT</th>
                <th>STUDENT</th>
                <th>COURSE / BATCH</th>
                <th>PRESENT</th>
                <th>ABSENT</th>
                <th>MARKED SESSIONS</th>
                <th>ATTENDANCE</th>
              </tr>
            </thead>

            <tbody>
              {report.map((r) => (
                <tr key={r.enrollment}>
                  <td>{r.enrollment}</td>
                  <td><strong>{r.name}</strong></td>
                  <td>{r.course}<br /><small>{r.batch}</small></td>
                  <td>{r.present}</td>
                  <td>{r.absent}</td>
                  <td>{r.total}</td>
                  <td>
                    <strong>{r.total ? `${r.percentage}%` : "No data"}</strong>
                  </td>
                </tr>
              ))}

              {!report.length && (
                <tr>
                  <td colSpan="7">
                    No student records found. Add students or import a CSV first.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Stat({ title, value }) {
  return (
    <div className="stat-card">
      <div className="stat-icon blue"><FileSpreadsheet size={20} /></div>
      <p className="stat-title">{title}</p>
      <p className="stat-value">{value}</p>
    </div>
  );
}