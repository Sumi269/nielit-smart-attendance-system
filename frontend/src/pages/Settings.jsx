import { useState } from "react";
import {
  Settings as SettingsIcon,
  Save,
  ShieldCheck,
  Database,
  AlertCircle,
} from "lucide-react";

const DEFAULT_SETTINGS = {
  institution: "National Institute of Electronics & Information Technology",
  centre: "NIELIT Kolkata",
  threshold: 80,
  academicYear: "2026-27",
  timezone: "Asia/Kolkata",
  duplicatePolicy: "Prevent duplicate entries",
};

function loadSettings() {
  try {
    return {
      ...DEFAULT_SETTINGS,
      ...(JSON.parse(localStorage.getItem("nielit_settings")) || {}),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export default function Settings() {
  const [settings, setSettings] = useState(loadSettings);
  const [message, setMessage] = useState("");

  function update(event) {
    const { name, value } = event.target;

    setSettings((current) => ({
      ...current,
      [name]: name === "threshold" ? Number(value) : value,
    }));
  }

  function save(event) {
    event.preventDefault();

    if (
      !Number.isFinite(settings.threshold) ||
      settings.threshold < 0 ||
      settings.threshold > 100
    ) {
      setMessage("Attendance threshold must be between 0 and 100.");
      return;
    }

    localStorage.setItem("nielit_settings", JSON.stringify(settings));
    setMessage("Demonstration preferences saved in this browser.");
  }

  return (
    <section>
      <div className="page-heading">
        <div>
          <p className="eyebrow">SYSTEM CONFIGURATION</p>
          <h1>Settings</h1>
          <p className="page-description">
            Configure local preferences for the attendance interface.
          </p>
        </div>
      </div>

      <div className="demo-notice">
        <AlertCircle size={18} />
        <div>
          <strong>Local settings only</strong>
          <p>
            These preferences do not change institutional policy or server
            settings. Official thresholds must be authorized by NIELIT.
          </p>
        </div>
      </div>

      {message && <p className="success-message">{message}</p>}

      <form onSubmit={save}>
        <div className="panel" style={{ marginBottom: 20 }}>
          <div className="panel-heading">
            <div>
              <h2><SettingsIcon size={19} /> Institution Preferences</h2>
              <p>Institution and reporting defaults.</p>
            </div>
          </div>

          <div className="form-grid" style={{ marginTop: 20 }}>
            <Field label="Institution Name">
              <input name="institution" value={settings.institution} onChange={update} required />
            </Field>

            <Field label="Centre Name">
              <input name="centre" value={settings.centre} onChange={update} required />
            </Field>

            <Field label="Default Academic Year">
              <select name="academicYear" value={settings.academicYear} onChange={update}>
                <option>2025-26</option>
                <option>2026-27</option>
                <option>2027-28</option>
                <option>2028-29</option>
              </select>
            </Field>

            <Field label="Timezone">
              <select name="timezone" value={settings.timezone} onChange={update}>
                <option value="Asia/Kolkata">India — Asia/Kolkata</option>
                <option value="UTC">UTC</option>
              </select>
            </Field>
          </div>
        </div>

        <div className="panel" style={{ marginBottom: 20 }}>
          <div className="panel-heading">
            <div>
              <h2><ShieldCheck size={19} /> Attendance Policy Preferences</h2>
              <p>Demonstration settings; not an official policy override.</p>
            </div>
          </div>

          <div className="form-grid" style={{ marginTop: 20 }}>
            <Field label="Attendance Threshold (%)">
              <input
                type="number"
                name="threshold"
                min="0"
                max="100"
                value={settings.threshold}
                onChange={update}
                required
              />
            </Field>

            <Field label="Duplicate Attendance Handling">
              <select name="duplicatePolicy" value={settings.duplicatePolicy} onChange={update}>
                <option>Prevent duplicate entries</option>
                <option>Flag duplicates for review</option>
              </select>
            </Field>
          </div>

          <p className="muted-note" style={{ marginTop: 18 }}>
            Attendance corrections must preserve the original record, the
            reason for correction, the approving user, and the approval time.
            The application must never automatically inflate attendance
            percentages to meet a threshold.
          </p>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <div>
              <h2><Database size={19} /> Data & Privacy</h2>
              <p>Current prototype storage information.</p>
            </div>
          </div>

          <ul className="settings-list">
            <li>Storage: browser localStorage.</li>
            <li>Shared database: not connected.</li>
            <li>Authentication and roles: not implemented.</li>
            <li>Biometric collection: not implemented.</li>
            <li>Automatic backups: not implemented.</li>
          </ul>
        </div>

        <div className="form-actions">
          <button type="submit" className="action-button">
            <Save size={16} /> Save Preferences
          </button>
        </div>
      </form>
    </section>
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