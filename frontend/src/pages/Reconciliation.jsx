import { useState } from "react";
import {
  GitCompareArrows,
  Plus,
  CheckCircle2,
  AlertTriangle,
  X,
} from "lucide-react";

const INITIAL = [
  {
    id: 1,
    date: "2026-10-20",
    enrollment: "NIELIT/2026/001",
    name: "Aarav Sharma",
    register: "Present",
    biometric: "Present",
    resolution: "Matched",
    notes: "",
  },
  {
    id: 2,
    date: "2026-10-20",
    enrollment: "NIELIT/2026/002",
    name: "Priya Das",
    register: "Present",
    biometric: "Absent",
    resolution: "Needs Review",
    notes: "Sample discrepancy",
  },
];

export default function Reconciliation() {
  const [records, setRecords] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("nielit_reconciliation")) || INITIAL;
    } catch {
      return INITIAL;
    }
  });

  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    date: new Date().toLocaleDateString("en-CA"),
    enrollment: "",
    name: "",
    register: "Present",
    biometric: "Absent",
    notes: "",
  });

  function persist(next) {
    setRecords(next);
    localStorage.setItem("nielit_reconciliation", JSON.stringify(next));
  }

  function addRecord(event) {
    event.preventDefault();

    if (!form.enrollment.trim() || !form.name.trim()) {
      setMessage("Enrollment number and name are required.");
      return;
    }

    const item = {
      ...form,
      id: Date.now(),
      resolution: form.register === form.biometric ? "Matched" : "Needs Review",
    };

    persist([item, ...records]);
    setShowForm(false);
    setMessage("Comparison record added.");
    setForm({
      date: new Date().toLocaleDateString("en-CA"),
      enrollment: "",
      name: "",
      register: "Present",
      biometric: "Absent",
      notes: "",
    });
  }

  function resolve(id) {
    const item = records.find((record) => record.id === id);

    if (!item || item.register !== item.biometric) {
      setMessage(
        "The two sources disagree. Verify the physical register and supporting evidence before approving a correction."
      );
      return;
    }

    persist(
      records.map((record) =>
        record.id === id
          ? { ...record, resolution: "Matched" }
          : record
      )
    );

    setMessage("Sources match. Record marked as matched.");
  }

  const matched = records.filter((r) => r.register === r.biometric).length;
  const review = records.length - matched;

  return (
    <section>
      <div className="page-heading">
        <div>
          <p className="eyebrow">RECORD VERIFICATION</p>
          <h1>Attendance Reconciliation</h1>
          <p className="page-description">
            Compare physical register entries with biometric attendance events.
          </p>
        </div>

        <button className="action-button" onClick={() => setShowForm(!showForm)}>
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Cancel" : "Add Comparison"}
        </button>
      </div>

      <div className="demo-notice">
        <AlertTriangle size={18} />
        <div>
          <strong>Review discrepancies before changing attendance</strong>
          <p>
            A biometric mismatch is not automatic proof of absence. Check
            supporting evidence and record the authorized decision.
          </p>
        </div>
      </div>

      {message && <p className="success-message">{message}</p>}

      <div className="stats-grid">
        <Stat title="Total Comparisons" value={records.length} />
        <Stat title="Matched" value={matched} />
        <Stat title="Needs Review" value={review} />
        <Stat
          title="Match Rate"
          value={`${records.length ? Math.round((matched / records.length) * 100) : 0}%`}
        />
      </div>

      {showForm && (
        <form className="panel form-grid" onSubmit={addRecord}>
          <Field label="Date">
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>
          <Field label="Enrollment Number">
            <input required value={form.enrollment} onChange={(e) => setForm({ ...form, enrollment: e.target.value })} />
          </Field>
          <Field label="Student Name">
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Physical Register">
            <select value={form.register} onChange={(e) => setForm({ ...form, register: e.target.value })}>
              <option>Present</option><option>Absent</option>
            </select>
          </Field>
          <Field label="Biometric Source">
            <select value={form.biometric} onChange={(e) => setForm({ ...form, biometric: e.target.value })}>
              <option>Present</option><option>Absent</option>
            </select>
          </Field>
          <Field label="Notes">
            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Evidence or explanation" />
          </Field>
          <button className="action-button">Add Comparison</button>
        </form>
      )}

      <div className="panel">
        <div className="panel-heading">
          <div>
            <h2><GitCompareArrows size={19} /> Reconciliation Register</h2>
            <p>Discrepancies remain unresolved until reviewed.</p>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>DATE</th>
                <th>STUDENT</th>
                <th>PHYSICAL REGISTER</th>
                <th>BIOMETRIC</th>
                <th>RESULT</th>
                <th>NOTES</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => {
                const isMatched = record.register === record.biometric;

                return (
                  <tr key={record.id}>
                    <td>{record.date}</td>
                    <td>
                      <strong>{record.name}</strong>
                      <br />
                      <small>{record.enrollment}</small>
                    </td>
                    <td>{record.register}</td>
                    <td>{record.biometric}</td>
                    <td>
                      <span className={isMatched ? "badge-success" : "badge-warning"}>
                        {isMatched ? "Matched" : "Needs Review"}
                      </span>
                    </td>
                    <td>{record.notes || "—"}</td>
                    <td>
                      {isMatched ? (
                        <CheckCircle2 size={17} />
                      ) : (
                        <button
                          className="secondary-button"
                          onClick={() => resolve(record.id)}
                        >
                          Review
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
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
      <div className="stat-icon blue"><GitCompareArrows size={20} /></div>
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