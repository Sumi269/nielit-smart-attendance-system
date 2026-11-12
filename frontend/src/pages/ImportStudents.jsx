import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  Search,
  Trash2,
  Users,
  CalendarDays,
  BookOpen,
} from "lucide-react";

function clean(value) {
  return String(value ?? "").trim();
}

function normalizeHeader(value) {
  return clean(value).toLowerCase().replace(/[\s_-]+/g, " ");
}

function detectAttendanceSheet(worksheet) {
  const rows = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  const headerIndex = rows.findIndex((row) => {
    const values = row.map(normalizeHeader);
    return (
      values.includes("emp id") &&
      values.includes("name")
    );
  });

  if (headerIndex === -1) {
    return {
      valid: false,
      error: "Could not find the Emp Id and Name header row.",
    };
  }

  const headers = rows[headerIndex].map(clean);
  const idIndex = headers.findIndex(
    (header) => normalizeHeader(header) === "emp id"
  );
  const nameIndex = headers.findIndex(
    (header) => normalizeHeader(header) === "name"
  );

  const dayColumns = headers
    .map((header, index) => ({
      header,
      index,
      day: Number(header),
    }))
    .filter(
      (column) =>
        column.index > Math.max(idIndex, nameIndex) &&
        /^\d{1,2}$/.test(column.header) &&
        column.day >= 1 &&
        column.day <= 31
    );

  if (dayColumns.length === 0) {
    return {
      valid: false,
      error: "No daily attendance columns from 1 to 31 were found.",
    };
  }

  const title = clean(rows[1]?.[0]);
  const monthMatch = title.match(
    /of\s+([A-Za-z]+)\s*,?\s*(\d{4})/i
  );

  const students = [];

  for (let rowIndex = headerIndex + 1; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    const studentId = clean(row[idIndex]);
    const studentName = clean(row[nameIndex]);

    if (!studentId && !studentName) continue;

    const attendance = {};
    const errors = [];

    if (!studentId) errors.push("Missing employee/student ID");
    if (!studentName) errors.push("Missing student name");

    dayColumns.forEach(({ day, index }) => {
      const value = clean(row[index]).toUpperCase();

      if (value === "P" || value === "A") {
        attendance[day] = value;
      } else if (
        value === "W" ||
        value === "H" ||
        value === "L" ||
        value === ""
      ) {
        attendance[day] = value;
      } else {
        attendance[day] = value;
        errors.push(`Unrecognized mark for day ${day}: ${value}`);
      }
    });

    const seen = Object.values(attendance);
    const present = seen.filter((value) => value === "P").length;
    const absent = seen.filter((value) => value === "A").length;

    students.push({
      studentId,
      studentName,
      attendance,
      present,
      absent,
      errors,
      excelRow: rowIndex + 1,
    });
  }

  const seenIds = new Set();

  students.forEach((student) => {
    const key = student.studentId.toUpperCase();

    if (key && seenIds.has(key)) {
      student.errors.push("Duplicate ID in this worksheet");
    }

    if (key) seenIds.add(key);
  });

  return {
    valid: true,
    students,
    days: dayColumns.map((column) => column.day),
    month: monthMatch ? monthMatch[1] : "",
    year: monthMatch ? monthMatch[2] : "",
    title,
  };
}

export default function ImportStudents() {
  const [fileName, setFileName] = useState("");
  const [sheets, setSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [records, setRecords] = useState([]);
  const [days, setDays] = useState([]);
  const [course, setCourse] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const validCount = records.filter(
    (record) => record.errors.length === 0
  ).length;

  const invalidCount = records.length - validCount;

  const filteredRecords = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) return records;

    return records.filter(
      (record) =>
        record.studentId.toLowerCase().includes(query) ||
        record.studentName.toLowerCase().includes(query)
    );
  }, [records, search]);

  async function handleFile(event) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      setError("Please upload an Excel .xlsx file.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    setRecords([]);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, {
        type: "array",
        cellDates: true,
      });

      const availableSheets = workbook.SheetNames.map((name) => {
        const result = detectAttendanceSheet(workbook.Sheets[name]);

        return {
          name,
          ...result,
        };
      });

      const validSheets = availableSheets.filter((sheet) => sheet.valid);

      if (!validSheets.length) {
        throw new Error(
          "No attendance worksheets were found. The workbook must contain Emp Id, Name, and daily attendance columns."
        );
      }

      setFileName(file.name);
      setSheets(availableSheets);

      const firstSheet = validSheets[0];

      setSelectedSheet(firstSheet.name);
      setCourse(firstSheet.name);
      setRecords(firstSheet.students);
      setDays(firstSheet.days);
      setMonth(firstSheet.month);
      setYear(firstSheet.year);

      setMessage(
        `Workbook loaded successfully. Found ${validSheets.length} attendance worksheet(s).`
      );
    } catch (err) {
      setError(err.message || "Could not read the Excel workbook.");
      setFileName("");
      setSheets([]);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }

  function changeSheet(event) {
    const name = event.target.value;
    const sheet = sheets.find((item) => item.name === name);

    setSelectedSheet(name);
    setCourse(name);
    setError("");
    setMessage("");

    if (!sheet?.valid) {
      setRecords([]);
      setDays([]);
      setError(sheet?.error || "This worksheet is not a valid attendance sheet.");
      return;
    }

    setRecords(sheet.students);
    setDays(sheet.days);
    setMonth(sheet.month);
    setYear(sheet.year);
    setMessage(`Previewing worksheet: ${name}`);
  }

  function exportWorkbook() {
    if (!records.length) return;

    const outputRows = records.map((record) => {
      const row = {
        "Emp Id": record.studentId,
        Name: record.studentName,
      };

      days.forEach((day) => {
        row[day] = record.attendance[day] || "";
      });

      row.Present = record.present;
      row.Absent = record.absent;
      row["Validation status"] = record.errors.length
        ? record.errors.join("; ")
        : "Valid";

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(outputRows);

    worksheet["!cols"] = Object.keys(outputRows[0] || {}).map(
      (column) => ({
        wch: Math.max(String(column).length + 3, 12),
      })
    );

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Attendance Preview"
    );

    XLSX.writeFile(
      workbook,
      "NIELIT_Attendance_Import_Preview.xlsx"
    );
  }

  function clearFile() {
    setFileName("");
    setSheets([]);
    setSelectedSheet("");
    setRecords([]);
    setDays([]);
    setCourse("");
    setMonth("");
    setYear("");
    setSearch("");
    setError("");
    setMessage("");
  }

  function validateForImport() {
    if (invalidCount > 0) {
      setError(
        "Please review the invalid records before continuing."
      );
      return;
    }

    setError("");
    setMessage(
      `${validCount} records passed validation. They have not been saved because the backend is not connected yet.`
    );
  }

  return (
    <div className="page-container import-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">ATTENDANCE MANAGEMENT</span>
          <h1>Excel Attendance Import</h1>
          <p>
            Import your existing NIELIT monthly attendance workbook
            without converting it to CSV.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={exportWorkbook}
          disabled={!records.length}
        >
          <Download size={17} />
          Export Preview
        </button>
      </div>

      <div className="notice-box">
        <AlertTriangle size={20} />
        <div>
          <strong>Review before importing</strong>
          <p>
            The workbook is read locally in your browser. This version
            does not modify the original file or save records to the
            database.
          </p>
        </div>
      </div>

      <section className="panel upload-panel">
        <div className="panel-title">
          <div className="icon-tile">
            <FileSpreadsheet size={23} />
          </div>

          <div>
            <h2>Upload existing attendance workbook</h2>
            <p>
              Supports worksheets containing Emp Id, Name, daily P/A
              marks, and summary columns.
            </p>
          </div>
        </div>

        <label className="upload-dropzone">
          <div className="upload-icon">
            <Upload size={28} />
          </div>

          <strong>
            {loading ? "Reading workbook..." : "Select Excel workbook"}
          </strong>

          <span>
            Choose your monthly attendance .xlsx file
          </span>

          <span className="file-format">XLSX EXCEL WORKBOOK</span>

          <input
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={handleFile}
            disabled={loading}
          />
        </label>

        {fileName && (
          <div className="selected-file">
            <FileSpreadsheet size={22} />

            <div className="selected-file-details">
              <strong>{fileName}</strong>
              <span>
                {sheets.filter((sheet) => sheet.valid).length} valid
                attendance worksheet(s)
              </span>
            </div>

            <button
              className="icon-button danger-button"
              type="button"
              onClick={clearFile}
              title="Clear workbook"
              aria-label="Clear workbook"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </section>

      {error && (
        <div className="feedback-message feedback-error" role="alert">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div className="feedback-message feedback-success" role="status">
          <CheckCircle2 size={18} />
          <span>{message}</span>
        </div>
      )}

      {records.length > 0 && (
        <>
          <section className="panel">
            <div className="preview-header">
              <div>
                <h2>Attendance worksheet details</h2>
                <p>
                  Select a course sheet and verify the reporting period.
                </p>
              </div>
            </div>

            <div className="import-form-grid">
              <div className="form-field">
                <label htmlFor="attendance-sheet">
                  Course worksheet
                </label>

                <select
                  id="attendance-sheet"
                  value={selectedSheet}
                  onChange={changeSheet}
                >
                  {sheets.map((sheet) => (
                    <option key={sheet.name} value={sheet.name}>
                      {sheet.name}
                      {!sheet.valid ? " — Invalid format" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="course-name">Course name</label>

                <input
                  id="course-name"
                  value={course}
                  onChange={(event) => setCourse(event.target.value)}
                />
              </div>

              <div className="form-field">
                <label htmlFor="attendance-month">Month</label>

                <input
                  id="attendance-month"
                  value={month}
                  onChange={(event) => setMonth(event.target.value)}
                  placeholder="e.g. June"
                />
              </div>

              <div className="form-field">
                <label htmlFor="attendance-year">Year</label>

                <input
                  id="attendance-year"
                  value={year}
                  onChange={(event) => setYear(event.target.value)}
                  placeholder="e.g. 2026"
                />
              </div>
            </div>
          </section>

          <div className="summary-grid import-summary">
            <div className="summary-card">
              <div className="summary-card-icon blue-icon">
                <Users size={21} />
              </div>
              <span>Student records</span>
              <strong>{records.length}</strong>
              <small>Current worksheet</small>
            </div>

            <div className="summary-card">
              <div className="summary-card-icon green-icon">
                <CheckCircle2 size={21} />
              </div>
              <span>Valid records</span>
              <strong>{validCount}</strong>
              <small>Passed validation</small>
            </div>

            <div className="summary-card">
              <div className="summary-card-icon amber-icon">
                <AlertTriangle size={21} />
              </div>
              <span>Needs review</span>
              <strong>{invalidCount}</strong>
              <small>Errors or duplicate IDs</small>
            </div>
          </div>

          <section className="panel preview-panel">
            <div className="preview-header">
              <div>
                <h2>Monthly attendance preview</h2>
                <p>
                  Daily marks are shown separately from the original
                  workbook's summary columns.
                </p>
              </div>

              <span className="status-pill status-valid">
                <BookOpen size={14} />
                {days.length} day columns
              </span>
            </div>

            <div className="table-toolbar">
              <div className="search-box">
                <Search size={17} />

                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search student ID or name..."
                  aria-label="Search students"
                />
              </div>

              <span className="record-count">
                {filteredRecords.length} of {records.length} students
              </span>
            </div>

            <div className="table-wrapper">
              <table className="data-table import-table">
                <thead>
                  <tr>
                    <th>Excel row</th>
                    <th>Emp ID</th>
                    <th>Student name</th>

                    {days.map((day) => (
                      <th key={day}>{day}</th>
                    ))}

                    <th>Present</th>
                    <th>Absent</th>
                    <th>Validation</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRecords.map((record) => (
                    <tr
                      key={`${record.excelRow}-${record.studentId}`}
                      className={
                        record.errors.length ? "row-invalid" : ""
                      }
                    >
                      <td>{record.excelRow}</td>
                      <td>
                        <span className="student-id">
                          {record.studentId || "—"}
                        </span>
                      </td>
                      <td>{record.studentName || "—"}</td>

                      {days.map((day) => {
                        const mark = record.attendance[day] || "";

                        return (
                          <td
                            key={day}
                            className={`attendance-mark mark-${mark.toLowerCase()}`}
                            title={`Day ${day}: ${mark || "No mark"}`}
                          >
                            {mark || "—"}
                          </td>
                        );
                      })}

                      <td>{record.present}</td>
                      <td>{record.absent}</td>
                      <td>
                        {record.errors.length === 0 ? (
                          <span className="status-pill status-valid">
                            <CheckCircle2 size={14} />
                            Valid
                          </span>
                        ) : (
                          <span
                            className="status-pill status-invalid"
                            title={record.errors.join("; ")}
                          >
                            <AlertTriangle size={14} />
                            {record.errors.length} issue(s)
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredRecords.length === 0 && (
                <div className="empty-state">
                  No matching students found.
                </div>
              )}
            </div>

            {invalidCount > 0 && (
              <div className="validation-details">
                <h3>
                  <AlertTriangle size={17} />
                  Records requiring review
                </h3>

                {records
                  .filter((record) => record.errors.length > 0)
                  .slice(0, 20)
                  .map((record) => (
                    <div
                      className="validation-row"
                      key={record.excelRow}
                    >
                      <strong>
                        Row {record.excelRow} —{" "}
                        {record.studentName || "Unnamed student"}
                      </strong>

                      <span>{record.errors.join(" • ")}</span>
                    </div>
                  ))}
              </div>
            )}

            <div className="import-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={exportWorkbook}
              >
                <Download size={16} />
                Download reviewed workbook
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={validateForImport}
                disabled={invalidCount > 0}
              >
                <CheckCircle2 size={17} />
                Validate for import
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}