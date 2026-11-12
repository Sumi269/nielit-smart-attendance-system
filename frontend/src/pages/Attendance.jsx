import { useMemo, useState } from "react";
import {
  CalendarCheck,
  Search,
  Save,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { calculateAttendance } from "../utils/attendanceCalculator";

const DEMO_STUDENTS = [
  { id: 1, enrollment: "NIELIT/2026/001", name: "Aarav Sharma", batch: "O Level - January 2026" },
  { id: 2, enrollment: "NIELIT/2026/002", name: "Priya Das", batch: "CABA - February 2026" },
  { id: 3, enrollment: "NIELIT/2026/003", name: "Rahul Verma", batch: "Cyber Security - March 2026" },
  { id: 4, enrollment: "NIELIT/2026/004", name: "Sneha Roy", batch: "O Level - January 2026" },
];

function today() {
  return new Date().toLocaleDateString("en-CA");
}

function readAttendance() {
  try {
    return JSON.parse(localStorage.getItem("nielit_attendance")) || {};
  } catch {
    return {};
  }
}

export default function Attendance() {
  const [students] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("nielit_students"));
      return Array.isArray(saved) && saved.length ? saved : DEMO_STUDENTS;
    } catch {
      return DEMO_STUDENTS;
    }
  });

  const [date, setDate] = useState(today());
  const [batch, setBatch] = useState("All");
  const [search, setSearch] = useState("");
  const [records, setRecords] = useState(readAttendance);
  const [message, setMessage] = useState("");

  const batches = [...new Set(students.map((student) => student.batch).filter(Boolean))];
  const key = `${date}__${batch}`;

  const visibleStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesBatch = batch === "All" || student.batch === batch;
      const term = search.toLowerCase();
      const matchesSearch = !term ||
        `${student.name} ${student.enrollment}`.toLowerCase().includes(term);

      return matchesBatch && matchesSearch;
    });
  }, [students, batch, search]);

  function statusOf(student) {
    return records[key]?.[student.id] || "Unmarked";
  }

  function mark(studentId, status) {
    setRecords((current) => ({
      ...current,
      [key]: {
        ...(current[key] || {}),
        [studentId]: status,
      },
    }));
    setMessage("");
  }

  function saveRegister() {
    const next = { ...records };
    const missing = visibleStudents.filter(
      (student) => !next[key]?.[student.id] || next[key][student.id] === "Unmarked"
    );

    if (missing.length) {
      setMessage(`${missing.length} students remain unmarked. Mark every student before saving.`);
      return;
    }

    localStorage.setItem("nielit_attendance", JSON.stringify(next));
    setRecords(next);
    setMessage("Daily attendance saved in this browser.");
  }

  const present = visibleStudents.filter((student) => statusOf(student) === "Present").length;
  const absent = visibleStudents.filter((student) => statusOf(student) === "Absent").length;
  const marked = present + absent;
  const percentage = calculateAttendance(present, marked);

  return (
    <section>
      <div className="page-heading">
        <div>
          <p className="eyebrow">DAILY OPERATIONS</p>
          <h1>Attendance Management</h1>
          <p className="page-description">
            Record attendance, review daily registers and avoid duplicate entries.
          </p>
        </div>
      </div>

      <div className="demo-notice">
        <AlertCircle size={18} />
        <div>
          <strong>Demonstration attendance only</strong>
          <p>Do not use these browser records as the official attendance register.</p>
        </div>
      </div>

      {message && <p className="success-message">{message}</p>}

      <div className="stats-grid">
        <Stat title="Students Listed" value={visibleStudents.length} />
        <Stat title="Present" value={present} />
        <Stat title="Absent" value={absent} />
        <Stat title="Marked Attendance" value={`${percentage}%`} />
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <h2><CalendarCheck size={19} /> Daily Register</h2>
            <p>Select the class date and batch before marking attendance.</p>
          </div>
        </div>

        <div className="student-toolbar" style={{ marginTop: 20 }}>
          <label className="form-field">
            <span>Class Date</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>

          <label className="form-field">
            <span>Batch</span>
            <select value={batch} onChange={(e) => setBatch(e.target.value)}>
              <option value="All">All batches</option>
              {batches.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>

          <label className="form-field">
            <span>Search</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name or enrollment" />
          </label>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>ENROLLMENT</th>
                <th>STUDENT</th>
                <th>BATCH</th>
                <th>ATTENDANCE STATUS</th>
              </tr>
            </thead>

            <tbody>
              {visibleStudents.map((student) => (
                <tr key={student.id}>
                  <td>{student.enrollment}</td>
                  <td><strong>{student.name}</strong></td>
                  <td>{student.batch}</td>
                  <td>
                    <div className="attendance-actions">
                      <button
                        className={statusOf(student) === "Present" ? "status-button present selected" : "status-button present"}
                        onClick={() => mark(student.id, "Present")}
                      >
                        Present
                      </button>
                      <button
                        className={statusOf(student) === "Absent" ? "status-button absent selected" : "status-button absent"}
                        onClick={() => mark(student.id, "Absent")}
                      >
                        Absent
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!visibleStudents.length && (
                <tr><td colSpan="4">No students found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="form-actions">
          <span className="muted-note">
            {marked} of {visibleStudents.length} students marked
          </span>
          <button className="action-button" onClick={saveRegister}>
            <Save size={16} /> Save Register
          </button>
        </div>
      </div>
    </section>
  );
}

function Stat({ title, value }) {
  return (
    <div className="stat-card">
      <div className="stat-icon blue"><CheckCircle2 size={20} /></div>
      <p className="stat-title">{title}</p>
      <p className="stat-value">{value}</p>
    </div>
  );
}