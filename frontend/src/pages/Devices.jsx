import { useState } from "react";
import {
  Fingerprint,
  Plus,
  Radio,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

const INITIAL_DEVICES = [
  {
    id: 1,
    name: "Attendance Device 01",
    deviceId: "NIELIT-ATT-001",
    location: "Training Room 1",
    connection: "Offline",
    lastSync: "Not connected",
    status: "Demo",
  },
];

export default function Devices() {
  const [devices, setDevices] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("nielit_devices")) || INITIAL_DEVICES;
    } catch {
      return INITIAL_DEVICES;
    }
  });

  const [formOpen, setFormOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    deviceId: "",
    location: "",
  });

  function persist(next) {
    setDevices(next);
    localStorage.setItem("nielit_devices", JSON.stringify(next));
  }

  function addDevice(event) {
    event.preventDefault();

    if (!form.name.trim() || !form.deviceId.trim()) {
      setMessage("Device name and ID are required.");
      return;
    }

    if (devices.some((d) => d.deviceId === form.deviceId.trim())) {
      setMessage("That device ID already exists.");
      return;
    }

    persist([
      {
        ...form,
        id: Date.now(),
        name: form.name.trim(),
        deviceId: form.deviceId.trim(),
        location: form.location.trim(),
        connection: "Not connected",
        lastSync: "Never",
        status: "Unverified",
      },
      ...devices,
    ]);

    setForm({ name: "", deviceId: "", location: "" });
    setFormOpen(false);
    setMessage("Device entry added. Hardware verification is still required.");
  }

  return (
    <section>
      <div className="page-heading">
        <div>
          <p className="eyebrow">HARDWARE MANAGEMENT</p>
          <h1>Biometric Devices</h1>
          <p className="page-description">
            Register devices and monitor their future synchronization status.
          </p>
        </div>

        <button className="action-button" onClick={() => setFormOpen(!formOpen)}>
          <Plus size={16} /> Register Device
        </button>
      </div>

      <div className="demo-notice">
        <ShieldCheck size={18} />
        <div>
          <strong>No biometric data is being collected</strong>
          <p>
            Device entries are local placeholders. Secure device authentication,
            encryption, fingerprint enrollment and synchronization are not yet implemented.
          </p>
        </div>
      </div>

      {message && <p className="success-message">{message}</p>}

      <div className="stats-grid">
        <Stat title="Registered Devices" value={devices.length} />
        <Stat title="Connected Devices" value={devices.filter((d) => d.connection === "Connected").length} />
        <Stat title="Offline Devices" value={devices.filter((d) => d.connection === "Offline").length} />
        <Stat title="Verified Devices" value={devices.filter((d) => d.status === "Verified").length} />
      </div>

      {formOpen && (
        <form className="panel form-grid" onSubmit={addDevice}>
          <Field label="Device Name">
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>

          <Field label="Unique Device ID">
            <input required value={form.deviceId} onChange={(e) => setForm({ ...form, deviceId: e.target.value })} />
          </Field>

          <Field label="Installation Location">
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </Field>

          <button className="action-button">Save Device Entry</button>
        </form>
      )}

      <div className="panel">
        <div className="panel-heading">
          <div>
            <h2><Fingerprint size={19} /> Registered Devices</h2>
            <p>Connection indicators are demonstration values only.</p>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>DEVICE</th>
                <th>DEVICE ID</th>
                <th>LOCATION</th>
                <th>CONNECTION</th>
                <th>LAST SYNC</th>
                <th>VERIFICATION</th>
              </tr>
            </thead>

            <tbody>
              {devices.map((device) => (
                <tr key={device.id}>
                  <td><strong>{device.name}</strong></td>
                  <td>{device.deviceId}</td>
                  <td>{device.location || "Not specified"}</td>
                  <td><Radio size={15} /> {device.connection}</td>
                  <td>{device.lastSync}</td>
                  <td>{device.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="muted-note" style={{ marginTop: 15 }}>
          A real device must authenticate to the server and send signed,
          timestamped events over an encrypted connection. Do not store raw
          fingerprint images in attendance records.
        </p>
      </div>
    </section>
  );
}

function Stat({ title, value }) {
  return (
    <div className="stat-card">
      <div className="stat-icon blue"><Fingerprint size={20} /></div>
      <p className="stat-title">{title}</p>
      <p className="stat-value">{value}</p>
    </div>
  );
}

function Field({ label, children }) {
  return <label className="form-field"><span>{label}</span>{children}</label>;
}