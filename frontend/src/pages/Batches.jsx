import { useState } from "react";
import {
  Layers,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Users,
  AlertCircle,
} from "lucide-react";

const INITIAL_BATCHES = [
  {
    id: 1,
    name: "O Level - January 2026",
    code: "OL-JAN26",
    course: "NIELIT O Level",
    year: "2026-27",
    startDate: "2026-01-15",
    endDate: "2027-01-14",
    status: "Active",
  },
  {
    id: 2,
    name: "CABA - February 2026",
    code: "CABA-FEB26",
    course: "CABA-MDTP",
    year: "2026-27",
    startDate: "2026-02-01",
    endDate: "2026-08-01",
    status: "Active",
  },
  {
    id: 3,
    name: "Cyber Security - March 2026",
    code: "CYBER-MAR26",
    course: "Cyber Security",
    year: "2026-27",
    startDate: "2026-03-01",
    endDate: "2026-09-01",
    status: "Active",
  },
];

const EMPTY = {
  name: "",
  code: "",
  course: "",
  year: "2026-27",
  startDate: "",
  endDate: "",
  status: "Active",
};

function loadBatches() {
  try {
    return JSON.parse(localStorage.getItem("nielit_batches")) || INITIAL_BATCHES;
  } catch {
    return INITIAL_BATCHES;
  }
}

export default function Batches() {
  const [batches, setBatches] = useState(loadBatches);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function persist(next) {
    setBatches(next);
    localStorage.setItem("nielit_batches", JSON.stringify(next));
  }

  function save(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!form.name.trim() || !form.code.trim() || !form.course) {
      setError("Batch name, code and course are required.");
      return;
    }

    if (
      form.startDate &&
      form.endDate &&
      form.endDate < form.startDate
    ) {
      setError("End date cannot be before start date.");
      return;
    }

    if (
      batches.some(
        (batch) =>
          batch.code.toLowerCase() === form.code.trim().toLowerCase() &&
          batch.id !== editing
      )
    ) {
      setError("This batch code already exists.");
      return;
    }

    const item = {
      ...form,
      id: editing ?? Date.now(),
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
    };

    persist(
      editing
        ? batches.map((batch) => (batch.id === editing ? item : batch))
        : [item, ...batches]
    );

    setOpen(false);
    setEditing(null);
    setForm(EMPTY);
    setMessage(editing ? "Batch updated." : "Batch added.");
  }

  function edit(batch) {
    setEditing(batch.id);
    setForm({ ...batch });
    setError("");
    setOpen(true);
  }

  function remove(batch) {
    if (!window.confirm(`Remove batch "${batch.name}" from demo data?`)) {
      return;
    }

    persist(batches.filter((item) => item.id !== batch.id));
    setMessage("Batch removed from demonstration data.");
  }

  const visible = batches.filter((batch) => {
    const term = search.toLowerCase();

    return (
      (!term ||
        `${batch.name} ${batch.code} ${batch.course}`
          .toLowerCase()
          .includes(term)) &&
      (filter === "All" || batch.status === filter)
    );
  });

  return (
    <section>
      <div className="page-heading">
        <div>
          <p className="eyebrow">ACADEMIC MANAGEMENT</p>
          <h1>Batches Management</h1>
          <p className="page-description">
            Organize courses, academic years and training batches.
          </p>
        </div>

        <button
          className="action-button"
          onClick={() => {
            setEditing(null);
            setForm(EMPTY);
            setError("");
            setOpen(true);
          }}
        >
          <Plus size={16} /> Add Batch
        </button>
      </div>

      <div className="demo-notice">
        <AlertCircle size={18} />
        <div>
          <strong>Demonstration mode</strong>
          <p>These batches are saved only in this browser.</p>
        </div>
      </div>

      {message && <p className="success-message">{message}</p>}

      <div className="stats-grid">
        <Stat title="Total Batches" value={batches.length} />
        <Stat
          title="Active Batches"
          value={batches.filter((b) => b.status === "Active").length}
        />
        <Stat
          title="Completed Batches"
          value={batches.filter((b) => b.status === "Completed").length}
        />
        <Stat
          title="Courses Covered"
          value={new Set(batches.map((b) => b.course)).size}
        />
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <h2>Batch Directory</h2>
            <p>Search and maintain batch information.</p>
          </div>
        </div>

        <div className="student-toolbar" style={{ marginTop: 20 }}>
          <input
            className="search-input"
            placeholder="Search batch, code or course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="search-input"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option>All</option>
            <option>Active</option>
            <option>Completed</option>
            <option>Inactive</option>
          </select>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>BATCH</th>
                <th>CODE</th>
                <th>COURSE</th>
                <th>ACADEMIC YEAR</th>
                <th>START DATE</th>
                <th>END DATE</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {visible.map((batch) => (
                <tr key={batch.id}>
                  <td><strong>{batch.name}</strong></td>
                  <td>{batch.code}</td>
                  <td>{batch.course}</td>
                  <td>{batch.year}</td>
                  <td>{batch.startDate || "—"}</td>
                  <td>{batch.endDate || "—"}</td>
                  <td>{batch.status}</td>
                  <td>
                    <button
                      className="icon-button"
                      onClick={() => edit(batch)}
                      aria-label={`Edit ${batch.name}`}
                    >
                      <Pencil size={15} />
                    </button>{" "}
                    <button
                      className="icon-button"
                      onClick={() => remove(batch)}
                      aria-label={`Remove ${batch.name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}

              {visible.length === 0 && (
                <tr><td colSpan="8">No matching batches.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <div className="modal-backdrop">
          <form className="form-modal" onSubmit={save}>
            <div className="panel-heading">
              <h2>{editing ? "Edit Batch" : "Add Batch"}</h2>
              <button type="button" className="icon-button" onClick={() => setOpen(false)}>
                <X size={17} />
              </button>
            </div>

            {error && <p className="error-message">{error}</p>}

            <div className="form-grid">
              <Field label="Batch Name *">
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Field>

              <Field label="Batch Code *">
                <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
              </Field>

              <Field label="Course *">
                <input required value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} placeholder="Enter course name" />
              </Field>

              <Field label="Academic Year">
                <select value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })}>
                  <option>2025-26</option>
                  <option>2026-27</option>
                  <option>2027-28</option>
                  <option>2028-29</option>
                </select>
              </Field>

              <Field label="Start Date">
                <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </Field>

              <Field label="End Date">
                <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </Field>

              <Field label="Status">
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option>Active</option>
                  <option>Completed</option>
                  <option>Inactive</option>
                </select>
              </Field>
            </div>

            <div className="form-actions">
              <button type="button" className="secondary-button" onClick={() => setOpen(false)}>Cancel</button>
              <button className="action-button">Save Batch</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

function Stat({ title, value }) {
  return (
    <div className="stat-card">
      <div className="stat-icon blue"><Layers size={20} /></div>
      <p className="stat-title">{title}</p>
      <p className="stat-value">{value}</p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="form-field">
      <span>{label}</span>
      {children}
    </label>
  );
}