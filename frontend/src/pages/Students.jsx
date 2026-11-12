import { useMemo, useState } from "react";
import {
  Users,
  UserPlus,
  Search,
  Pencil,
  Trash2,
  X,
  Download,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const INITIAL_STUDENTS = [
  {
    id: 1,
    enrollment: "NIELIT/2026/001",
    name: "Aarav Sharma",
    email: "aarav@example.com",
    phone: "9876543210",
    course: "O Level",
    batch: "O Level - Jan 2026",
    year: "2026-27",
    status: "Active",
  },
  {
    id: 2,
    enrollment: "NIELIT/2026/002",
    name: "Priya Das",
    email: "priya@example.com",
    phone: "9876543211",
    course: "CABA",
    batch: "CABA - Feb 2026",
    year: "2026-27",
    status: "Active",
  },
  {
    id: 3,
    enrollment: "NIELIT/2026/003",
    name: "Rahul Verma",
    email: "rahul@example.com",
    phone: "9876543212",
    course: "Cyber Security",
    batch: "Cyber Security - Mar 2026",
    year: "2026-27",
    status: "Active",
  },
  {
    id: 4,
    enrollment: "NIELIT/2026/004",
    name: "Sneha Roy",
    email: "sneha@example.com",
    phone: "9876543213",
    course: "O Level",
    batch: "O Level - Jan 2026",
    year: "2026-27",
    status: "Inactive",
  },
];

const EMPTY_FORM = {
  enrollment: "",
  name: "",
  email: "",
  phone: "",
  course: "",
  batch: "",
  year: "2026-27",
  status: "Active",
};

function readSavedStudents() {
  try {
    const saved = localStorage.getItem("nielit_students");
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  } catch {
    return INITIAL_STUDENTS;
  }
}

export default function Students() {
  const [students, setStudents] = useState(readSavedStudents);
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("All");
  const [batchFilter, setBatchFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const courses = [
    "O Level",
    "CABA",
    "Cyber Security",
    "CCC",
    "Other",
  ];

  const batches = useMemo(
    () => [...new Set(students.map((student) => student.batch).filter(Boolean))],
    [students]
  );

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase();

    return students.filter((student) => {
      const matchesSearch =
        !term ||
        [
          student.name,
          student.enrollment,
          student.email,
          student.phone,
          student.course,
          student.batch,
        ].some((value) => String(value || "").toLowerCase().includes(term));

      const matchesCourse =
        courseFilter === "All" || student.course === courseFilter;

      const matchesBatch =
        batchFilter === "All" || student.batch === batchFilter;

      const matchesStatus =
        statusFilter === "All" || student.status === statusFilter;

      return (
        matchesSearch &&
        matchesCourse &&
        matchesBatch &&
        matchesStatus
      );
    });
  }, [students, search, courseFilter, batchFilter, statusFilter]);

  function persistStudents(nextStudents) {
    setStudents(nextStudents);

    try {
      localStorage.setItem("nielit_students", JSON.stringify(nextStudents));
    } catch {
      setError("Could not save records in this browser.");
    }
  }

  function openAddModal() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function openEditModal(student) {
    setEditingId(student.id);
    setForm({ ...EMPTY_FORM, ...student });
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
  }

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "course" ? { batch: "" } : {}),
    }));
  }

  function saveStudent(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (
      !form.enrollment.trim() ||
      !form.name.trim() ||
      !form.course ||
      !form.batch ||
      !form.year
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!/^[A-Za-z0-9/_-]+$/.test(form.enrollment.trim())) {
      setError("Enrollment number contains unsupported characters.");
      return;
    }

    const duplicate = students.some(
      (student) =>
        student.enrollment.toLowerCase() ===
          form.enrollment.trim().toLowerCase() &&
        student.id !== editingId
    );

    if (duplicate) {
      setError("This enrollment number already exists.");
      return;
    }

    if (
      form.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    ) {
      setError("Please enter a valid email address.");
      return;
    }

    if (form.phone.trim() && !/^[0-9+\-\s]{7,15}$/.test(form.phone.trim())) {
      setError("Please enter a valid phone number.");
      return;
    }

    const student = {
      ...form,
      id: editingId ?? Date.now(),
      enrollment: form.enrollment.trim(),
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
    };

    const nextStudents = editingId
      ? students.map((item) => (item.id === editingId ? student : item))
      : [student, ...students];

    persistStudents(nextStudents);
    closeModal();
    setSuccess(
      editingId
        ? "Student details updated successfully."
        : "Student added successfully."
    );
  }

  function deleteStudent(student) {
    const confirmed = window.confirm(
      `Delete ${student.name} (${student.enrollment})? This removes the record from this browser's demo data.`
    );

    if (!confirmed) return;

    persistStudents(
      students.filter((item) => item.id !== student.id)
    );
    setSuccess("Student removed from the demo records.");
  }

  function exportCSV() {
    const headers = [
      "Enrollment Number",
      "Student Name",
      "Email",
      "Phone",
      "Course",
      "Batch",
      "Academic Year",
      "Status",
    ];

    const rows = filteredStudents.map((student) => [
      student.enrollment,
      student.name,
      student.email,
      student.phone,
      student.course,
      student.batch,
      student.year,
      student.status,
    ]);

    const escapeCSV = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCSV).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "nielit-students.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  const activeCount = students.filter(
    (student) => student.status === "Active"
  ).length;

  return (
    <section>
      <div className="page-heading">
        <div>
          <p className="eyebrow">MANAGEMENT</p>
          <h1>Student Management</h1>
          <p className="page-description">
            Manage student profiles, enrollment numbers, courses, and batches.
          </p>
        </div>

        <button className="action-button" onClick={openAddModal}>
          <UserPlus size={16} style={{ verticalAlign: "middle", marginRight: 7 }} />
          Add Student
        </button>
      </div>

      <div className="demo-notice">
        <AlertCircle size={19} />
        <div>
          <strong>Frontend development mode</strong>
          <p>
            These are demonstration records stored in this browser. They are
            not connected to the official NIELIT student database.
          </p>
        </div>
      </div>

      {success && (
        <div
          className="success-message"
          role="status"
          style={{
            padding: 13,
            marginBottom: 16,
            color: "#166534",
            background: "#dcfce7",
            borderRadius: 8,
            fontSize: 12,
          }}
        >
          <CheckCircle2
            size={16}
            style={{ verticalAlign: "middle", marginRight: 7 }}
          />
          {success}
          <button
            onClick={() => setSuccess("")}
            aria-label="Dismiss message"
            style={{
              float: "right",
              border: 0,
              background: "transparent",
              color: "inherit",
            }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      <div className="stats-grid">
        <StudentStat
          icon={<Users size={21} />}
          title="Total Students"
          value={students.length}
          description="All student records in this browser"
          color="blue"
        />

        <StudentStat
          icon={<CheckCircle2 size={21} />}
          title="Active Students"
          value={activeCount}
          description="Currently marked as active"
          color="green"
        />

        <StudentStat
          icon={<GraduationCap size={21} />}
          title="Courses"
          value={new Set(students.map((s) => s.course)).size}
          description="Courses represented in the records"
          color="purple"
        />

        <StudentStat
          icon={<Users size={21} />}
          title="Batches"
          value={batches.length}
          description="Batches represented in the records"
          color="orange"
        />
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-heading">
          <div>
            <h2>Student Directory</h2>
            <p>Search and filter student records.</p>
          </div>

          <button className="action-button" onClick={exportCSV}>
            <Download
              size={15}
              style={{ verticalAlign: "middle", marginRight: 7 }}
            />
            Export CSV
          </button>
        </div>

        <div className="student-toolbar" style={{ marginTop: 22 }}>
          <div style={{ position: "relative", flex: "1 1 230px" }}>
            <Search
              size={17}
              style={{
                position: "absolute",
                left: 12,
                top: 12,
                color: "#8993a5",
              }}
            />
            <input
              className="search-input"
              style={{ paddingLeft: 38, maxWidth: "100%" }}
              placeholder="Search name, enrollment, email..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            className="search-input"
            style={{ width: "auto", maxWidth: "100%" }}
            value={courseFilter}
            onChange={(event) => setCourseFilter(event.target.value)}
            aria-label="Filter by course"
          >
            <option value="All">All courses</option>
            {courses.map((course) => (
              <option key={course} value={course}>
                {course}
              </option>
            ))}
          </select>

          <select
            className="search-input"
            style={{ width: "auto", maxWidth: "100%" }}
            value={batchFilter}
            onChange={(event) => setBatchFilter(event.target.value)}
            aria-label="Filter by batch"
          >
            <option value="All">All batches</option>
            {batches.map((batch) => (
              <option key={batch} value={batch}>
                {batch}
              </option>
            ))}
          </select>

          <select
            className="search-input"
            style={{ width: "auto", maxWidth: "100%" }}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter by status"
          >
            <option value="All">All statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>STUDENT</th>
                <th>ENROLLMENT NO.</th>
                <th>COURSE / BATCH</th>
                <th>ACADEMIC YEAR</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.id}>
                  <td>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <div
                        className="profile-avatar"
                        style={{ width: 35, height: 35, flexShrink: 0 }}
                      >
                        {student.name
                          .split(" ")
                          .map((part) => part[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </div>

                      <div>
                        <strong style={{ display: "block", fontSize: 11 }}>
                          {student.name}
                        </strong>
                        <span
                          style={{
                            display: "block",
                            marginTop: 5,
                            color: "#8993a5",
                            fontSize: 10,
                          }}
                        >
                          {student.email || "No email provided"}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td>{student.enrollment}</td>

                  <td>
                    <strong style={{ display: "block", fontSize: 11 }}>
                      {student.course}
                    </strong>
                    <span
                      style={{
                        display: "block",
                        marginTop: 5,
                        color: "#8993a5",
                        fontSize: 10,
                      }}
                    >
                      {student.batch}
                    </span>
                  </td>

                  <td>{student.year}</td>

                  <td>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "5px 9px",
                        color:
                          student.status === "Active" ? "#15803d" : "#667085",
                        background:
                          student.status === "Active" ? "#dcfce7" : "#f2f4f7",
                        borderRadius: 20,
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    >
                      {student.status}
                    </span>
                  </td>

                  <td>
                    <div style={{ display: "flex", gap: 7 }}>
                      <button
                        className="icon-button"
                        onClick={() => openEditModal(student)}
                        title="Edit student"
                        aria-label={`Edit ${student.name}`}
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        className="icon-button"
                        onClick={() => deleteStudent(student)}
                        title="Delete demo record"
                        aria-label={`Delete ${student.name}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan="6" className="empty-cell">
                    No students match your search or filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="muted-note" style={{ marginTop: 15 }}>
          Showing {filteredStudents.length} of {students.length} student records.
          Changes are stored locally in this browser only.
        </p>
      </div>

      {modalOpen && (
        <div
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "grid",
            placeItems: "center",
            padding: 16,
            background: "rgba(15, 23, 42, 0.55)",
            overflowY: "auto",
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-form-title"
            style={{
              width: "100%",
              maxWidth: 650,
              maxHeight: "92vh",
              overflowY: "auto",
              padding: 25,
              background: "white",
              borderRadius: 14,
              boxShadow: "0 20px 60px rgba(15, 23, 42, 0.2)",
            }}
          >
            <div className="panel-heading" style={{ marginBottom: 22 }}>
              <div>
                <h2 id="student-form-title">
                  {editingId ? "Edit Student" : "Add New Student"}
                </h2>
                <p>
                  Enter the student's information. Fields marked * are required.
                </p>
              </div>

              <button
                className="icon-button"
                onClick={closeModal}
                aria-label="Close form"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div
                role="alert"
                style={{
                  marginBottom: 16,
                  padding: 12,
                  color: "#b42318",
                  background: "#fef3f2",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={saveStudent}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 17,
                }}
              >
                <FormField label="Enrollment Number *">
                  <input
                    required
                    name="enrollment"
                    value={form.enrollment}
                    onChange={updateField}
                    placeholder="e.g. NIELIT/2026/005"
                  />
                </FormField>

                <FormField label="Student Name *">
                  <input
                    required
                    name="name"
                    value={form.name}
                    onChange={updateField}
                    placeholder="Full name"
                  />
                </FormField>

                <FormField label="Email Address">
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={updateField}
                    placeholder="student@example.com"
                  />
                </FormField>

                <FormField label="Phone Number">
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={updateField}
                    placeholder="Phone number"
                  />
                </FormField>

                <FormField label="Course *">
                  <select
                    required
                    name="course"
                    value={form.course}
                    onChange={updateField}
                  >
                    <option value="">Select course</option>
                    {courses.map((course) => (
                      <option key={course} value={course}>
                        {course}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Batch *">
                  <input
                    required
                    name="batch"
                    value={form.batch}
                    onChange={updateField}
                    placeholder="e.g. O Level - Jan 2026"
                  />
                </FormField>

                <FormField label="Academic Year *">
                  <select
                    required
                    name="year"
                    value={form.year}
                    onChange={updateField}
                  >
                    <option value="2025-26">2025-26</option>
                    <option value="2026-27">2026-27</option>
                    <option value="2027-28">2027-28</option>
                    <option value="2028-29">2028-29</option>
                  </select>
                </FormField>

                <FormField label="Student Status *">
                  <select
                    required
                    name="status"
                    value={form.status}
                    onChange={updateField}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </FormField>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                  marginTop: 25,
                  paddingTop: 20,
                  borderTop: "1px solid #edf0f5",
                }}
              >
                <button
                  type="button"
                  className="icon-button"
                  style={{ width: "auto", padding: "0 17px" }}
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button type="submit" className="action-button">
                  {editingId ? "Save Changes" : "Add Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

function StudentStat({ icon, title, value, description, color }) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <div className={`stat-icon ${color}`}>{icon}</div>
        <span className="demo-badge">DEMO</span>
      </div>

      <p className="stat-title">{title}</p>
      <p className="stat-value">{value}</p>
      <p className="stat-description">{description}</p>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <label
      style={{
        display: "grid",
        gap: 8,
        color: "#475467",
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      {label}

      {React.cloneElement(children, {
        style: {
          width: "100%",
          minWidth: 0,
          padding: "11px 12px",
          color: "#344054",
          background: "white",
          border: "1px solid #dfe5ef",
          borderRadius: 8,
          outline: "none",
          fontSize: 12,
          ...(children.props.style || {}),
        },
      })}
    </label>
  );
}