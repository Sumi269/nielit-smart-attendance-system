import { useMemo, useState } from "react";
import {
  BookOpen,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  GraduationCap,
  Users,
  Clock3,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const INITIAL_COURSES = [
  {
    id: 1,
    code: "OLEVEL",
    name: "NIELIT O Level",
    category: "IT",
    duration: "12 Months",
    description: "Foundation course in computer applications.",
    status: "Active",
  },
  {
    id: 2,
    code: "CABA",
    name: "CABA-MDTP",
    category: "IT",
    duration: "6 Months",
    description: "Computer applications and business-oriented training.",
    status: "Active",
  },
  {
    id: 3,
    code: "CYBER",
    name: "Cyber Security",
    category: "Cyber Security",
    duration: "6 Months",
    description: "Cyber security fundamentals and practical training.",
    status: "Active",
  },
  {
    id: 4,
    code: "CCC",
    name: "Course on Computer Concepts",
    category: "IT",
    duration: "3 Months",
    description: "Basic computer concepts and digital literacy.",
    status: "Active",
  },
];

const EMPTY_FORM = {
  code: "",
  name: "",
  category: "IT",
  duration: "",
  description: "",
  status: "Active",
};

function loadCourses() {
  try {
    const saved = localStorage.getItem("nielit_courses");
    return saved ? JSON.parse(saved) : INITIAL_COURSES;
  } catch {
    return INITIAL_COURSES;
  }
}

export default function Courses() {
  const [courses, setCourses] = useState(loadCourses);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const categories = useMemo(
    () => [...new Set(courses.map((course) => course.category))],
    [courses]
  );

  const filteredCourses = useMemo(() => {
    const term = search.trim().toLowerCase();

    return courses.filter((course) => {
      const matchesSearch =
        !term ||
        [
          course.code,
          course.name,
          course.category,
          course.description,
        ].some((value) => String(value || "").toLowerCase().includes(term));

      const matchesCategory =
        categoryFilter === "All" || course.category === categoryFilter;

      const matchesStatus =
        statusFilter === "All" || course.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [courses, search, categoryFilter, statusFilter]);

  const activeCourses = courses.filter(
    (course) => course.status === "Active"
  ).length;

  function saveCourses(nextCourses) {
    setCourses(nextCourses);

    try {
      localStorage.setItem("nielit_courses", JSON.stringify(nextCourses));
    } catch {
      setError("Could not save changes in browser storage.");
    }
  }

  function openAddModal() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
    setModalOpen(true);
  }

  function openEditModal(course) {
    setEditingId(course.id);
    setForm({ ...EMPTY_FORM, ...course });
    setError("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const code = form.code.trim().toUpperCase();
    const name = form.name.trim();

    if (!code || !name || !form.category || !form.duration) {
      setError("Please complete all required fields.");
      return;
    }

    const duplicate = courses.some(
      (course) =>
        course.code.toLowerCase() === code.toLowerCase() &&
        course.id !== editingId
    );

    if (duplicate) {
      setError("This course code already exists.");
      return;
    }

    const updatedCourse = {
      ...form,
      id: editingId ?? Date.now(),
      code,
      name,
      description: form.description.trim(),
    };

    const nextCourses = editingId
      ? courses.map((course) =>
          course.id === editingId ? updatedCourse : course
        )
      : [updatedCourse, ...courses];

    saveCourses(nextCourses);
    closeModal();

    setSuccess(
      editingId
        ? "Course updated successfully."
        : "Course added successfully."
    );
  }

  function deleteCourse(course) {
    const confirmed = window.confirm(
      `Delete course "${course.name}"? This affects the local demonstration course list only.`
    );

    if (!confirmed) return;

    saveCourses(courses.filter((item) => item.id !== course.id));
    setSuccess("Course removed from the demonstration list.");
  }

  return (
    <section>
      <div className="page-heading">
        <div>
          <p className="eyebrow">ACADEMIC MANAGEMENT</p>
          <h1>Courses Management</h1>
          <p className="page-description">
            Manage course details, categories, durations, and availability.
          </p>
        </div>

        <button className="action-button" onClick={openAddModal}>
          <Plus
            size={16}
            style={{ verticalAlign: "middle", marginRight: 7 }}
          />
          Add Course
        </button>
      </div>

      <div className="demo-notice">
        <AlertCircle size={19} />
        <div>
          <strong>Frontend development mode</strong>
          <p>
            Course information is stored in this browser only. The module is
            not yet connected to the official NIELIT database.
          </p>
        </div>
      </div>

      {success && (
        <div
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
        <CourseStat
          icon={<BookOpen size={21} />}
          title="Total Courses"
          value={courses.length}
          description="Courses in the local directory"
          color="blue"
        />

        <CourseStat
          icon={<CheckCircle2 size={21} />}
          title="Active Courses"
          value={activeCourses}
          description="Courses marked as active"
          color="green"
        />

        <CourseStat
          icon={<GraduationCap size={21} />}
          title="Categories"
          value={categories.length}
          description="Distinct course categories"
          color="purple"
        />

        <CourseStat
          icon={<Users size={21} />}
          title="Student Records"
          value="—"
          description="Available after student-course integration"
          color="orange"
        />
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <h2>Course Directory</h2>
            <p>View and maintain course information.</p>
          </div>

          <span className="panel-badge">
            {filteredCourses.length} COURSES
          </span>
        </div>

        <div
          className="student-toolbar"
          style={{ marginTop: 22 }}
        >
          <div style={{ position: "relative", flex: "1 1 240px" }}>
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
              placeholder="Search course name or code..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            className="search-input"
            style={{ width: "auto" }}
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            aria-label="Filter by category"
          >
            <option value="All">All categories</option>

            {categories.map((category) => (
              <option value={category} key={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            className="search-input"
            style={{ width: "auto" }}
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
                <th>COURSE</th>
                <th>COURSE CODE</th>
                <th>CATEGORY</th>
                <th>DURATION</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {filteredCourses.map((course) => (
                <tr key={course.id}>
                  <td>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 11,
                      }}
                    >
                      <div
                        className="stat-icon blue"
                        style={{
                          width: 38,
                          height: 38,
                          flexShrink: 0,
                        }}
                      >
                        <BookOpen size={18} />
                      </div>

                      <div>
                        <strong
                          style={{
                            display: "block",
                            fontSize: 11,
                          }}
                        >
                          {course.name}
                        </strong>

                        <span
                          style={{
                            display: "block",
                            marginTop: 5,
                            color: "#8993a5",
                            fontSize: 10,
                          }}
                        >
                          {course.description || "No description"}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td>
                    <strong>{course.code}</strong>
                  </td>

                  <td>{course.category}</td>

                  <td>
                    <Clock3
                      size={13}
                      style={{
                        verticalAlign: "middle",
                        marginRight: 6,
                        color: "#8993a5",
                      }}
                    />
                    {course.duration}
                  </td>

                  <td>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "5px 9px",
                        color:
                          course.status === "Active"
                            ? "#15803d"
                            : "#667085",
                        background:
                          course.status === "Active"
                            ? "#dcfce7"
                            : "#f2f4f7",
                        borderRadius: 20,
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    >
                      {course.status}
                    </span>
                  </td>

                  <td>
                    <div style={{ display: "flex", gap: 7 }}>
                      <button
                        className="icon-button"
                        onClick={() => openEditModal(course)}
                        title="Edit course"
                        aria-label={`Edit ${course.name}`}
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        className="icon-button"
                        onClick={() => deleteCourse(course)}
                        title="Delete demo course"
                        aria-label={`Delete ${course.name}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredCourses.length === 0 && (
                <tr>
                  <td colSpan="6" className="empty-cell">
                    No courses match your search or filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="muted-note" style={{ marginTop: 15 }}>
          Course changes are saved in this browser. Before connecting real
          student records, we will add backend validation and protect courses
          referenced by existing batches.
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
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="course-form-title"
            style={{
              width: "100%",
              maxWidth: 620,
              maxHeight: "92vh",
              overflowY: "auto",
              padding: 25,
              background: "white",
              borderRadius: 14,
              boxShadow: "0 20px 60px rgba(15, 23, 42, 0.2)",
            }}
          >
            <div
              className="panel-heading"
              style={{ marginBottom: 22 }}
            >
              <div>
                <h2 id="course-form-title">
                  {editingId ? "Edit Course" : "Add New Course"}
                </h2>

                <p>
                  Enter course details. Fields marked * are required.
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

            <form onSubmit={handleSubmit}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 17,
                }}
              >
                <CourseField label="Course Code *">
                  <input
                    required
                    name="code"
                    value={form.code}
                    onChange={handleChange}
                    placeholder="e.g. OLEVEL"
                  />
                </CourseField>

                <CourseField label="Course Name *">
                  <input
                    required
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter course name"
                  />
                </CourseField>

                <CourseField label="Category *">
                  <select
                    required
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                  >
                    <option value="IT">IT</option>
                    <option value="Cyber Security">Cyber Security</option>
                    <option value="AI and Data Science">
                      AI and Data Science
                    </option>
                    <option value="Hardware">Hardware</option>
                    <option value="Other">Other</option>
                  </select>
                </CourseField>

                <CourseField label="Duration *">
                  <select
                    required
                    name="duration"
                    value={form.duration}
                    onChange={handleChange}
                  >
                    <option value="">Select duration</option>
                    <option value="1 Month">1 Month</option>
                    <option value="3 Months">3 Months</option>
                    <option value="6 Months">6 Months</option>
                    <option value="9 Months">9 Months</option>
                    <option value="12 Months">12 Months</option>
                    <option value="18 Months">18 Months</option>
                    <option value="24 Months">24 Months</option>
                    <option value="Custom">Custom</option>
                  </select>
                </CourseField>

                <CourseField label="Status *">
                  <select
                    required
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </CourseField>

                <CourseField label="Description">
                  <input
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Brief course description"
                  />
                </CourseField>
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
                  {editingId ? "Save Changes" : "Add Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

function CourseStat({ icon, title, value, description, color }) {
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

function CourseField({ label, children }) {
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

      {/*
        Keep form controls consistently styled with the rest of the app.
      */}
      {children.type === "select" ? (
        <select
          {...children.props}
          style={{
            width: "100%",
            minWidth: 0,
            padding: "11px 12px",
            color: "#344054",
            background: "white",
            border: "1px solid #dfe5ef",
            borderRadius: 8,
            outline: "none",
            fontSize: 12,
          }}
        />
      ) : (
        <input
          {...children.props}
          style={{
            width: "100%",
            minWidth: 0,
            padding: "11px 12px",
            color: "#344054",
            background: "white",
            border: "1px solid #dfe5ef",
            borderRadius: 8,
            outline: "none",
            fontSize: 12,
          }}
        />
      )}
    </label>
  );
}